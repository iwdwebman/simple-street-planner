// Ingress/Outgress OD Demand Manager with 24-Hour Time-of-Day Curve

import {
  IngressPoint,
  OutgressPoint,
  DemandRoute,
  TimeOfDayProfile,
} from '../types/street';
import { Vehicle } from './Vehicle';
import { LaneSegment } from './Network';

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
  accumulator: number;
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
      accumulator: Math.random() * 0.5,
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

    // Linear interpolation between hours
    return factorA * (1 - frac) + factorB * frac;
  }

  /**
   * Update spawners and generate new vehicles
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

      // Rate in vehicles per second = (trips/min / 60) * factor
      const ratePerSec = (route.baseRatePerMinute / 60) * factor;
      spawner.accumulator += ratePerSec * dt;

      while (spawner.accumulator >= 1.0) {
        spawner.accumulator -= 1.0;

        // Check if lane start has clearance
        const minClearance = 6.0; // 6m minimum gap to spawn
        let hasClearance = true;
        for (const v of lane.vehicles) {
          if (v.s < minClearance) {
            hasClearance = false;
            break;
          }
        }

        if (hasClearance) {
          const vehicle = new Vehicle({
            type: route.vehicleType,
            laneId: lane.id,
            s: ingress.positionMeters,
            v: 0,
            destinationOutgressId: route.destinationOutgressId,
            spawnTimeSeconds: simTimeSeconds,
          });
          lane.vehicles.push(vehicle);
          spawned.push(vehicle);
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
      accumulator: Math.random() * 0.5,
    }));
  }
}
