// Unified Fixed-Timestep Multi-Modal Simulation Engine for 5x 4-Way Crossroads

import { Vehicle } from './Vehicle';
import { LaneSegment, buildNetworkFromConfig, evaluateBezierFull } from './Network';
import { TrafficSignal } from './TrafficSignal';
import { DemandManager, DEFAULT_DIURNAL_PROFILE } from './DemandManager';
import {
  StreetConfig,
  IntersectionConfig,
  PlayFile,
} from '../types/street';
import { SimulationTelemetry, SimulationClock } from '../types/simulation';
import { VehicleType, VEHICLE_CONFIGS } from '../types/vehicle';
import { SCENARIO_COMPLETE_STREET } from '../storage/defaultScenarios';

export const FIXED_DT = 1 / 60; // 60 Hz physics

export class Engine {
  streetConfig: StreetConfig;
  intersections: IntersectionConfig[];
  lanes: Map<string, LaneSegment>;
  signals: TrafficSignal[];
  demandManager: DemandManager;
  clock: SimulationClock;

  // Telemetry accumulators
  completedTripsCount: number;
  totalTravelTimeAccum: number;
  recentTripSpeeds: number[];
  recentThroughputLog: { time: number; count: number }[];

  constructor(initialPlayFile?: PlayFile) {
    const playFile = initialPlayFile || SCENARIO_COMPLETE_STREET;

    this.completedTripsCount = 0;
    this.totalTravelTimeAccum = 0;
    this.recentTripSpeeds = [];
    this.recentThroughputLog = [];

    this.clock = {
      timeOfDayHours: playFile.initialTimeOfDayHours ?? 8.5,
      isPaused: false,
      speedMultiplier: 1,
      elapsedSeconds: 0,
    };

    this.streetConfig = playFile.street;
    this.intersections = playFile.intersections;
    const { lanes } = buildNetworkFromConfig(this.streetConfig);
    this.lanes = new Map(lanes.map((l) => [l.id, l]));

    this.signals = this.intersections
      .filter((i) => i.type === 'lights')
      .map((i) => new TrafficSignal(i.id, i.name, i.signalPhases || []));

    this.demandManager = new DemandManager(
      playFile.ingressPoints,
      playFile.outgressPoints,
      playFile.demandRoutes,
      playFile.timeOfDayProfile || DEFAULT_DIURNAL_PROFILE,
    );
  }

  /**
   * Rebuild the entire simulation network from updated street and intersection configs.
   * Preserves existing vehicles if their lanes still exist.
   */
  rebuildNetwork(street: StreetConfig, intersections: IntersectionConfig[]): void {
    this.streetConfig = street;
    this.intersections = intersections;

    const oldVehiclesByLane = new Map<string, Vehicle[]>();
    for (const [id, lane] of this.lanes.entries()) {
      oldVehiclesByLane.set(id, lane.vehicles);
    }

    const { lanes } = buildNetworkFromConfig(street);
    this.lanes = new Map();
    for (const lane of lanes) {
      if (oldVehiclesByLane.has(lane.id)) {
        lane.vehicles = oldVehiclesByLane.get(lane.id) || [];
      }
      this.lanes.set(lane.id, lane);
    }

    // Rebuild signals
    this.signals = intersections
      .filter((i) => i.type === 'lights')
      .map((i) => {
        const existing = this.signals.find((s) => s.id === i.id);
        if (existing && i.signalPhases && i.signalPhases.length > 0) {
          existing.phases = i.signalPhases;
          return existing;
        }
        return new TrafficSignal(i.id, i.name, i.signalPhases || []);
      });
  }

  /**
   * Reset simulation vehicles and telemetry metrics
   */
  resetSimulation(): void {
    for (const lane of this.lanes.values()) {
      lane.vehicles = [];
    }
    this.completedTripsCount = 0;
    this.totalTravelTimeAccum = 0;
    this.recentTripSpeeds = [];
    this.recentThroughputLog = [];
    this.clock.elapsedSeconds = 0;
  }

  /**
   * Single physics tick
   */
  private stepPhysics(dt: number): void {
    // 1. Advance signals
    for (const signal of this.signals) {
      signal.update(dt);
    }

    // 2. Advance time of day clock
    this.clock.elapsedSeconds += dt;
    this.clock.timeOfDayHours = (this.clock.timeOfDayHours + dt / 3600) % 24;

    // 3. Spawn demand across all ingress points (North, South, East, West)
    this.demandManager.step(dt, this.clock.timeOfDayHours, this.lanes, this.clock.elapsedSeconds);

    // 4. Update vehicles in all lanes
    const activeIntersection = this.intersections[0];

    for (const lane of this.lanes.values()) {
      lane.vehicles.sort((a, b) => a.s - b.s);

      // Determine signal/stop state for this lane
      let laneSignalState: 'green' | 'yellow' | 'red' = 'green';
      for (const signal of this.signals) {
        laneSignalState = signal.getSignalStateForLane(lane.id);
        if (laneSignalState !== 'green') break;
      }

      const baseLaneSpeedMs = (lane.speedLimitKmh || 50) / 3.6;

      for (let i = 0; i < lane.vehicles.length; i++) {
        const v = lane.vehicles[i];
        const tPos = Math.max(0, Math.min(1, v.s / Math.max(1, lane.length)));

        // Calculate local curve safe speed
        const curveEval = evaluateBezierFull(lane.curve, tPos);
        const curveSafeSpeed = curveEval.maxSafeSpeed;

        const targetSpeed = Math.min(v.v0, baseLaneSpeedMs, curveSafeSpeed);

        let sLead = Infinity;
        let vLead = targetSpeed;

        if (i + 1 < lane.vehicles.length) {
          const leader = lane.vehicles[i + 1];
          sLead = leader.s;
          vLead = leader.v;
        }

        // Virtual stop line obstacle (for red lights or stop signs)
        if (lane.stopLine !== undefined && v.s < lane.stopLine) {
          const stopLineS = lane.stopLine;

          if (activeIntersection?.type === 'lights') {
            if (laneSignalState === 'red' || (laneSignalState === 'yellow' && v.s < stopLineS - 15)) {
              if (stopLineS < sLead) {
                sLead = stopLineS;
                vLead = 0;
              }
            }
          } else if (activeIntersection?.type === 'stop') {
            const isAtStop = v.s >= stopLineS - 2.5 && v.s <= stopLineS + 1.0;
            const mustStop = v.updateStopState(dt, isAtStop, activeIntersection.stopDwellSeconds ?? 2.0);

            if (mustStop && stopLineS < sLead) {
              sLead = stopLineS;
              vLead = 0;
            }
          }
        }

        const acc = v.computeAcceleration(sLead, vLead, targetSpeed);
        v.integrate(dt, acc);
      }

      // Filter out vehicles that have exited the lane segment
      const exiting: Vehicle[] = [];
      lane.vehicles = lane.vehicles.filter((v) => {
        if (v.s >= lane.length) {
          exiting.push(v);
          return false;
        }
        return true;
      });

      // Record completed trip metrics
      for (const ex of exiting) {
        this.completedTripsCount++;
        const travelTime = Math.max(1, this.clock.elapsedSeconds - ex.spawnTime);
        this.totalTravelTimeAccum += travelTime;
        const avgSpeed = (ex.distanceTraveled / travelTime) * 3.6;
        this.recentTripSpeeds.push(avgSpeed);
        if (this.recentTripSpeeds.length > 50) this.recentTripSpeeds.shift();

        this.recentThroughputLog.push({
          time: this.clock.elapsedSeconds,
          count: 1,
        });
      }
    }

    // Prune throughput log older than 60 seconds
    const cutoff = this.clock.elapsedSeconds - 60;
    this.recentThroughputLog = this.recentThroughputLog.filter((log) => log.time >= cutoff);
  }

  /**
   * Advance simulation by multiplier ticks
   */
  update(multiplier = 1): void {
    if (this.clock.isPaused) return;
    const ticks = Math.max(1, Math.min(20, Math.round(multiplier)));
    for (let i = 0; i < ticks; i++) {
      this.stepPhysics(FIXED_DT);
    }
  }

  /**
   * Get real-time telemetry metrics
   */
  getTelemetry(): SimulationTelemetry {
    let activeCount = 0;
    const byType: Record<VehicleType, number> = {
      walker: 0,
      bike: 0,
      car: 0,
      truck: 0,
      delivery: 0,
      bus: 0,
      semi: 0,
    };

    let totalSpeedSum = 0;

    for (const lane of this.lanes.values()) {
      for (const v of lane.vehicles) {
        activeCount++;
        byType[v.type] = (byType[v.type] || 0) + 1;
        totalSpeedSum += v.v * 3.6; // km/h
      }
    }

    const throughputPerHour = this.recentThroughputLog.length * 60;
    const avgSpeed = activeCount > 0 ? totalSpeedSum / activeCount : 0;
    const avgTravelTime =
      this.completedTripsCount > 0
        ? this.totalTravelTimeAccum / this.completedTripsCount
        : 0;

    const congestionIndex = Math.max(
      0,
      Math.min(1.0, 1.0 - (activeCount > 0 ? avgSpeed / 45 : 1.0)),
    );

    return {
      activeVehiclesCount: activeCount,
      vehiclesByType: byType,
      throughputPerHour,
      averageSpeedKmh: avgSpeed,
      totalCompletedTrips: this.completedTripsCount,
      averageTravelTimeSeconds: avgTravelTime,
      congestionIndex,
    };
  }
}
