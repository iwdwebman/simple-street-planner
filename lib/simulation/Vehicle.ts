// Intelligent Driver Model (IDM) kinematics with 7 vehicle types and curvature speed limits

import { VehicleType, VEHICLE_CONFIGS } from '../types/vehicle';

export interface VehicleInitConfig {
  type: VehicleType;
  laneId: string;
  s: number;               // initial position along lane (m)
  v: number;               // initial speed (m/s)
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

  // IDM Physics Parameters
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

    this.s = config.s;
    this.v = Math.max(0, config.v);
    this.a = 0;

    const meta = VEHICLE_CONFIGS[config.type] || VEHICLE_CONFIGS.car;
    this.length = meta.params.length;
    this.width = meta.params.width;
    this.v0 = meta.params.v0;
    this.aMax = meta.params.aMax;
    this.bComf = meta.params.bComf;
    this.T = meta.params.T;
    this.s0 = meta.params.s0;

    this.stopDwellTimer = 0;
    this.hasCompletedStop = false;
    this.spawnTime = config.spawnTimeSeconds ?? 0;
    this.distanceTraveled = 0;
  }

  /**
   * Compute IDM acceleration with respect to a leading obstacle or vehicle.
   * @param sLead Position of leader front bumper (Infinity if no obstacle)
   * @param vLead Speed of leader (or 0 for stationary stop-line)
   * @param vTarget Local target speed limit (considers base speed, street limit, and curvature)
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
    // Clamp acceleration between hard braking (-8 m/s^2) and max capability
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
      if (this.hasCompletedStop && this.s > 5) {
        // Reset when well clear of stop line
      }
      return false;
    }

    if (this.hasCompletedStop) {
      return false; // already stopped and cleared to go
    }

    // If speed is very low near the stop line, accumulate dwell timer
    if (this.v <= 0.3) {
      this.stopDwellTimer += dt;
      if (this.stopDwellTimer >= requiredDwellSeconds) {
        this.hasCompletedStop = true;
        return false;
      }
    }

    return true; // still needs to stay stopped
  }
}
