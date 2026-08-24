// Intelligent Driver Model (IDM) Kinematics with Driver Randomization & Clumping Physics

import { VehicleType, VEHICLE_CONFIGS } from '../types/vehicle';

export interface VehicleInitConfig {
  type: VehicleType;
  laneId: string;
  s: number;               // initial position along lane (m)
  v?: number;              // initial speed (m/s) (if omitted, randomized cruising speed is computed)
  destinationOutgressId?: string;
  spawnTimeSeconds?: number;
}

let nextVehicleId = 1;

export class Vehicle {
  id: number;
  type: VehicleType;
  laneId: string;
  destinationOutgressId?: string;

  // Kinematics state
  s: number;               // longitudinal position (m) along lane
  v: number;               // longitudinal speed (m/s)
  a: number;               // current acceleration (m/s^2)

  // Geometry
  length: number;          // bumper-to-bumper length (m)
  width: number;           // vehicle width (m)

  // IDM Physics Parameters (Individualized per vehicle for natural heterogeneity)
  v0: number;              // free-flow desired speed (m/s)
  aMax: number;            // max acceleration (m/s^2)
  bComf: number;           // comfortable deceleration (m/s^2)
  T: number;               // desired time gap (s)
  s0: number;              // minimum jam distance (m)

  // Stop sign & signal states
  stopDwellTimer: number;  // seconds elapsed while stopped at stop line
  hasCompletedStop: boolean; // whether stop-sign required pause has been satisfied

  // Telemetry & Metrics
  spawnTime: number;
  distanceTraveled: number;

  constructor(config: VehicleInitConfig) {
    this.id = nextVehicleId++;
    this.type = config.type;
    this.laneId = config.laneId;
    this.destinationOutgressId = config.destinationOutgressId;

    const meta = VEHICLE_CONFIGS[config.type] || VEHICLE_CONFIGS.car;
    this.length = meta.params.length;
    this.width = meta.params.width;

    // Individual Driver Heterogeneity (Randomization Jitter)
    // Desired speed varies ±18% (e.g. brisk vs casual walkers, slow vs fast drivers)
    const speedJitter = (Math.random() - 0.5) * 0.36; // -0.18 to +0.18
    this.v0 = Math.max(0.8, meta.params.v0 * (1 + speedJitter));

    // Desired time headway varies ±15% (aggressive vs cautious drivers)
    const headwayJitter = (Math.random() - 0.5) * 0.30;
    this.T = Math.max(0.3, meta.params.T * (1 + headwayJitter));

    // Acceleration capability varies ±15%
    const accelJitter = (Math.random() - 0.5) * 0.30;
    this.aMax = Math.max(0.5, meta.params.aMax * (1 + accelJitter));
    this.bComf = meta.params.bComf;
    this.s0 = meta.params.s0;

    this.s = config.s;
    // Initial velocity: use provided speed, or natural cruising entry speed
    if (config.v !== undefined) {
      this.v = Math.max(0, config.v);
    } else {
      const entrySpeedFrac = 0.65 + Math.random() * 0.30; // 65% to 95% of desired speed
      this.v = this.v0 * entrySpeedFrac;
    }

    this.a = 0;
    this.stopDwellTimer = 0;
    this.hasCompletedStop = false;
    this.spawnTime = config.spawnTimeSeconds ?? 0;
    this.distanceTraveled = 0;
  }

  /**
   * Compute IDM acceleration with respect to a leading obstacle or vehicle.
   */
  computeAcceleration(sLead: number, vLead: number, vTarget: number): number {
    const effectiveV0 = Math.max(0.5, Math.min(this.v0, vTarget));
    const gap = sLead - this.s - this.length;
    const dv = this.v - vLead;

    let sStar: number;
    if (gap <= 0) {
      // Emergency braking when gap is closed
      sStar = Infinity;
    } else {
      const term1 = this.s0 + this.v * this.T;
      const term2 = (this.v * dv) / (2 * Math.sqrt(this.aMax * this.bComf));
      sStar = term1 + Math.max(0, term2);
    }

    // Free road term
    const freeRoad = 1 - Math.pow(this.v / effectiveV0, 4);
    // Interaction term
    const interaction = gap > 0 ? Math.pow(sStar / gap, 2) : 100;

    const acc = this.aMax * (freeRoad - interaction);
    return acc;
  }

  /**
   * Integrate kinematics forward by dt seconds.
   */
  integrate(dt: number, rawAcc: number): void {
    this.a = Math.max(-8.0, Math.min(this.aMax * 1.5, rawAcc));
    this.v = Math.max(0, this.v + this.a * dt);
    const ds = this.v * dt;
    this.s += ds;
    this.distanceTraveled += ds;
  }

  /**
   * Check and update stop sign dwell state.
   */
  updateStopState(dt: number, isAtStopSign: boolean, requiredDwellSeconds = 2.0): boolean {
    if (!isAtStopSign) {
      return false;
    }

    if (this.hasCompletedStop) {
      return false;
    }

    if (this.v <= 0.3) {
      this.stopDwellTimer += dt;
      if (this.stopDwellTimer >= requiredDwellSeconds) {
        this.hasCompletedStop = true;
        return false;
      }
    }

    return true;
  }
}
