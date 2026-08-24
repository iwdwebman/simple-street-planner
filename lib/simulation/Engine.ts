// Fixed-timestep simulation engine orchestrating signals, spawning, and vehicle physics

import { Vehicle, VehicleType } from './Vehicle';
import { LaneSegment, SpawnProfile, buildDefaultNetwork } from './Network';
import { TrafficSignal } from './TrafficSignal';

export const FIXED_DT = 1 / 60;

export interface EngineConfig {
  /** vehicles per second per spawn profile */
  demandRates: Partial<Record<string, number>>;
}

export class Engine {
  lanes: Map<string, LaneSegment>;
  signals: TrafficSignal[];
  spawnProfiles: SpawnProfile[];

  constructor(config?: EngineConfig) {
    const laneList = buildDefaultNetwork();
    this.lanes = new Map(laneList.map((l) => [l.id, l]));

    // Default traffic signals covering motor vehicle lanes
    this.signals = [
      new TrafficSignal('main', [
        {
          name: 'EB_Green',
          greenLanes: ['travel_lane_1', 'travel_lane_2'],
          duration: 30,
        },
        {
          name: 'All_Red',
          greenLanes: [],
          duration: 3,
        },
        {
          name: 'WB_Green',
          greenLanes: ['travel_lane_wb_1', 'travel_lane_wb_2'],
          duration: 30,
        },
        {
          name: 'All_Red_2',
          greenLanes: [],
          duration: 3,
        },
      ]),
    ];

    // Default spawn profiles
    const defaultRates: Record<string, { type: VehicleType; rate: number }> = {
      sidewalk_eb: { type: 'pedestrian', rate: 0.3 },
      sidewalk_wb: { type: 'pedestrian', rate: 0.3 },
      bike_eb: { type: 'bike', rate: 0.2 },
      bike_wb: { type: 'bike', rate: 0.2 },
      travel_lane_1: { type: 'car', rate: 0.3 },
      travel_lane_2: { type: 'car', rate: 0.25 },
      center_turn_lane: { type: 'bus', rate: 0.05 },
      travel_lane_wb_1: { type: 'car', rate: 0.3 },
      travel_lane_wb_2: { type: 'car', rate: 0.25 },
    };

    this.spawnProfiles = Object.entries(defaultRates).map(([laneId, { type, rate }]) => ({
      laneId,
      vehicleType: type,
      rate: config?.demandRates?.[laneId] ?? rate,
      _accumulator: Math.random(), // stagger initial spawns
    }));
  }

  /** Update demand rates at runtime */
  setDemandRate(laneId: string, rate: number): void {
    const profile = this.spawnProfiles.find((p) => p.laneId === laneId);
    if (profile) profile.rate = rate;
  }

  /** Update signal phase duration at runtime */
  setSignalPhaseDuration(signalId: string, phaseIndex: number, duration: number): void {
    const signal = this.signals.find((s) => s.id === signalId);
    if (signal && signal.phases[phaseIndex]) {
      signal.phases[phaseIndex].duration = duration;
    }
  }

  private updateSignals(dt: number): void {
    for (const signal of this.signals) {
      signal.update(dt);
    }
  }

  private isLaneGreen(laneId: string): boolean {
    for (const signal of this.signals) {
      // Only motor lanes are signal-controlled
      if (signal.currentPhase.greenLanes.length > 0) {
        if (signal.currentPhase.greenLanes.includes(laneId)) return true;
        // If the signal controls this lane type and it's not in greenLanes, it's red
        const motorLanes = new Set(
          signal.phases.flatMap((p) => p.greenLanes),
        );
        if (motorLanes.has(laneId)) return false;
      }
    }
    // Not signal-controlled → always green
    return true;
  }

  private spawnDemand(dt: number): void {
    for (const profile of this.spawnProfiles) {
      profile._accumulator += profile.rate * dt;
      while (profile._accumulator >= 1) {
        profile._accumulator -= 1;
        this.spawnVehicle(profile.laneId, profile.vehicleType);
      }
    }
  }

  private spawnVehicle(laneId: string, type: VehicleType): void {
    const lane = this.lanes.get(laneId);
    if (!lane) return;

    // Check clearance at spawn point (s=0)
    const minGap = 6;
    if (lane.vehicles.length > 0) {
      const last = lane.vehicles[lane.vehicles.length - 1];
      if (last.s < minGap) return; // too close to spawn
    }

    const v = new Vehicle({ type, laneId, s: 0, v: 0 });
    lane.vehicles.push(v);
  }

  private stepVehicles(dt: number): void {
    for (const lane of this.lanes.values()) {
      const isGreen = this.isLaneGreen(lane.id);
      const stopS = lane.stopLine;

      // Vehicles are stored ascending by s (front-of-queue last isn't guaranteed — sort first)
      lane.vehicles.sort((a, b) => a.s - b.s);

      for (let i = 0; i < lane.vehicles.length; i++) {
        const v = lane.vehicles[i];
        let sLead = Infinity;
        let vLead = v.v0;

        // Leader is next vehicle in sorted array (higher s)
        if (i + 1 < lane.vehicles.length) {
          const leader = lane.vehicles[i + 1];
          sLead = leader.s;
          vLead = leader.v;
        }

        // Virtual stop-line obstacle when red
        if (!isGreen && stopS !== undefined && v.s < stopS) {
          const stopObstacleFront = stopS;
          if (stopObstacleFront < sLead) {
            sLead = stopObstacleFront;
            vLead = 0;
          }
        }

        const acc = v.computeAcceleration(sLead, vLead);
        v.integrate(dt, acc);
      }

      // Remove vehicles that have exited the lane
      lane.vehicles = lane.vehicles.filter((v) => v.s < lane.length + v.length);
    }
  }

  /** Run `multiplier` simulation ticks */
  update(multiplier: number): void {
    for (let i = 0; i < multiplier; i++) {
      this.updateSignals(FIXED_DT);
      this.spawnDemand(FIXED_DT);
      this.stepVehicles(FIXED_DT);
    }
  }
}
