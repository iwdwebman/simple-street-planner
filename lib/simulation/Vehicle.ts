// 1D longitudinal kinematics & IDM car-following model

export type VehicleType = 'car' | 'bus' | 'bike' | 'pedestrian';

export interface VehicleConfig {
  type: VehicleType;
  laneId: string;
  s: number; // initial position along lane (m)
  v: number; // initial speed (m/s)
}

// IDM parameters per vehicle type
const IDM_PARAMS: Record<
  VehicleType,
  { v0: number; a: number; b: number; T: number; s0: number; length: number; width: number }
> = {
  car: { v0: 11.0, a: 1.5, b: 2.0, T: 1.5, s0: 2.0, length: 4.5, width: 2.0 },
  bus: { v0: 8.0, a: 0.8, b: 1.5, T: 2.0, s0: 3.0, length: 12.0, width: 2.5 },
  bike: { v0: 4.5, a: 1.0, b: 1.5, T: 1.0, s0: 1.0, length: 1.8, width: 0.6 },
  pedestrian: { v0: 1.2, a: 0.5, b: 1.0, T: 0.8, s0: 0.5, length: 0.5, width: 0.5 },
};

let nextId = 0;

export class Vehicle {
  id: number;
  type: VehicleType;
  laneId: string;
  s: number;
  v: number;
  a: number;
  length: number;
  width: number;
  // IDM parameters
  v0: number;
  aMax: number;
  b: number;
  T: number;
  s0: number;

  constructor(config: VehicleConfig) {
    this.id = nextId++;
    this.type = config.type;
    this.laneId = config.laneId;
    this.s = config.s;
    this.v = config.v;
    this.a = 0;

    const params = IDM_PARAMS[config.type];
    this.length = params.length;
    this.width = params.width;
    this.v0 = params.v0;
    this.aMax = params.a;
    this.b = params.b;
    this.T = params.T;
    this.s0 = params.s0;
  }

  /**
   * Compute IDM acceleration given the gap and approach rate to the leader.
   * @param sLead  position of leader vehicle front bumper (Infinity if no leader)
   * @param vLead  speed of leader (same as own speed if no leader)
   */
  computeAcceleration(sLead: number, vLead: number): number {
    const gap = sLead - this.s - this.length;
    const dv = this.v - vLead;

    let sStar: number;
    if (gap <= 0) {
      // Emergency braking — gap is zero or negative
      sStar = Infinity;
    } else {
      sStar =
        this.s0 +
        Math.max(0, this.v * this.T + (this.v * dv) / (2 * Math.sqrt(this.aMax * this.b)));
    }

    const freeRoad = 1 - Math.pow(this.v / this.v0, 4);
    const interaction = gap > 0 ? Math.pow(sStar / gap, 2) : 1;

    return this.aMax * (freeRoad - interaction);
  }

  /**
   * Integrate kinematics one timestep.
   */
  integrate(dt: number, acc: number): void {
    this.a = Math.max(-8, Math.min(4, acc)); // clamp acceleration
    this.v = Math.max(0, this.v + this.a * dt);
    this.s += this.v * dt;
  }
}
