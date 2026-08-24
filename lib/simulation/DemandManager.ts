// Ingress/Outgress Stochastic Demand Manager with Clumping & Burst Physics

import {
  IngressPoint,
  OutgressPoint,
  DemandRoute,
  TimeOfDayProfile,
} from '../types/street';
import { Vehicle } from './Vehicle';
import { LaneSegment } from './Network';
import { VehicleType, VEHICLE_CONFIGS } from '../types/vehicle';

export const DEFAULT_DIURNAL_PROFILE: TimeOfDayProfile = {
  name: 'Standard Urban Diurnal Curve',
  hourlyFactors: [
    0.05, // 00:00 (Midnight)
    0.03, // 01:00
    0.02, // 02:00
    0.03, // 03:00
    0.08, // 04:00
    0.25, // 05:00 (Early commuter)
    0.70, // 06:00
    1.45, // 07:00 (Morning Rush Start)
    1.90, // 08:00 (Morning Peak)
    1.30, // 09:00
    0.95, // 10:00
    1.05, // 11:00
    1.20, // 12:00 (Lunch rush)
    1.00, // 13:00
    1.15, // 14:00
    1.40, // 15:00 (School & shift change)
    1.75, // 16:00 (Evening Rush Start)
    2.10, // 17:00 (Evening Peak)
    1.60, // 18:00
    1.10, // 19:00
    0.75, // 20:00
    0.45, // 21:00
    0.25, // 22:00
    0.12, // 23:00
  ],
};

export interface ActiveDemandSpawner {
  route: DemandRoute;
  timeUntilNextArrival: number; // seconds until next stochastic event
}

export class DemandManager {
  ingressPoints: Map<string, IngressPoint>;
  outgressPoints: Map<string, OutgressPoint>;
  demandRoutes: DemandRoute[];
  timeOfDayProfile: TimeOfDayProfile;
  private spawners: ActiveDemandSpawner[];

  constructor(
    ingress: IngressPoint[] = [],
    outgress: OutgressPoint[] = [],
    routes: DemandRoute[] = [],
    profile: TimeOfDayProfile = DEFAULT_DIURNAL_PROFILE,
  ) {
    this.ingressPoints = new Map(ingress.map((i) => [i.id, i]));
    this.outgressPoints = new Map(outgress.map((o) => [o.id, o]));
    this.demandRoutes = routes;
    this.timeOfDayProfile = profile;
    this.spawners = routes.map((route) => ({
      route,
      timeUntilNextArrival: Math.random() * (60 / Math.max(1, route.baseRatePerMinute)),
    }));
  }

  /**
   * Get demand multiplier for current time of day (0..24h)
   */
  getDemandFactor(timeOfDayHours: number): number {
    const normalizedHour = ((timeOfDayHours % 24) + 24) % 24;
    const hourFloor = Math.floor(normalizedHour);
    const hourCeil = (hourFloor + 1) % 24;
    const frac = normalizedHour - hourFloor;

    const factorA = this.timeOfDayProfile.hourlyFactors[hourFloor] ?? 1.0;
    const factorB = this.timeOfDayProfile.hourlyFactors[hourCeil] ?? 1.0;

    return factorA * (1 - frac) + factorB * frac;
  }

  /**
   * Type-specific minimum spatial clearance needed at the ingress point
   */
  private getMinSpawnClearance(type: VehicleType): number {
    switch (type) {
      case 'walker':
        return 0.9; // Walkers can pack tightly in walking groups
      case 'bike':
        return 2.2; // Bikes can pack in close commuter platoons
      case 'car':
        return 5.8;
      case 'delivery':
        return 7.5;
      case 'truck':
        return 7.8;
      case 'bus':
        return 14.0;
      case 'semi':
        return 19.5;
      default:
        return 6.0;
    }
  }

  /**
   * Update spawners with stochastic Poisson arrival and multi-agent clumping
   */
  step(
    dt: number,
    timeOfDayHours: number,
    lanesMap: Map<string, LaneSegment>,
    simTimeSeconds: number,
  ): Vehicle[] {
    const spawned: Vehicle[] = [];
    const factor = this.getDemandFactor(timeOfDayHours);

    for (const spawner of this.spawners) {
      const { route } = spawner;
      const ingress = this.ingressPoints.get(route.originIngressId);
      if (!ingress) continue;

      const lane = lanesMap.get(ingress.laneId);
      if (!lane) continue;

      // Rate in events per second
      const lambda = Math.max(0.001, (route.baseRatePerMinute / 60) * factor);
      spawner.timeUntilNextArrival -= dt;

      if (spawner.timeUntilNextArrival <= 0) {
        // Draw next stochastic inter-arrival time from exponential distribution
        const u = Math.max(0.0001, Math.random());
        const nextInterval = -Math.log(u) / lambda;
        spawner.timeUntilNextArrival = Math.max(0.4, nextInterval);

        // Determine cluster / batch size (walkers and bikes clump up!)
        let batchSize = 1;
        const roll = Math.random();

        if (route.vehicleType === 'walker') {
          // 45% chance of walking in groups of 2 to 4
          if (roll < 0.25) batchSize = 2;
          else if (roll < 0.40) batchSize = 3;
          else if (roll < 0.48) batchSize = 4;
        } else if (route.vehicleType === 'bike') {
          // 35% chance of cycling in packs of 2 to 3
          if (roll < 0.25) batchSize = 2;
          else if (roll < 0.35) batchSize = 3;
        } else if (route.vehicleType === 'car') {
          // 20% chance of mini-platoon pair
          if (roll < 0.20) batchSize = 2;
        }

        const minClearance = this.getMinSpawnClearance(route.vehicleType);

        for (let b = 0; b < batchSize; b++) {
          const spawnOffset = b * (route.vehicleType === 'walker' ? 0.7 : route.vehicleType === 'bike' ? 2.0 : 6.0);

          // Check if lane mouth is clear
          let hasClearance = true;
          for (const v of lane.vehicles) {
            if (v.s < minClearance + spawnOffset) {
              hasClearance = false;
              break;
            }
          }

          if (hasClearance) {
            const vehicle = new Vehicle({
              type: route.vehicleType,
              laneId: lane.id,
              s: ingress.positionMeters + spawnOffset,
              destinationOutgressId: route.destinationOutgressId,
              spawnTimeSeconds: simTimeSeconds,
            });
            lane.vehicles.push(vehicle);
            spawned.push(vehicle);
          }
        }
      }
    }

    return spawned;
  }

  /**
   * Update configuration dynamically
   */
  setRoutes(
    ingress: IngressPoint[],
    outgress: OutgressPoint[],
    routes: DemandRoute[],
  ): void {
    this.ingressPoints = new Map(ingress.map((i) => [i.id, i]));
    this.outgressPoints = new Map(outgress.map((o) => [o.id, o]));
    this.demandRoutes = routes;
    this.spawners = routes.map((route) => ({
      route,
      timeUntilNextArrival: Math.random() * (60 / Math.max(1, route.baseRatePerMinute)),
    }));
  }
}
