// Traffic signal phase cycle state machine

export interface SignalPhase {
  name: string;
  greenLanes: string[]; // lane ids that have green
  duration: number;     // seconds
}

export class TrafficSignal {
  id: string;
  phases: SignalPhase[];
  private phaseIndex: number;
  private elapsed: number;

  constructor(id: string, phases: SignalPhase[]) {
    this.id = id;
    this.phases = phases;
    this.phaseIndex = 0;
    this.elapsed = 0;
  }

  get currentPhase(): SignalPhase {
    return this.phases[this.phaseIndex];
  }

  /** Returns true if the given lane currently has a green signal. */
  isGreen(laneId: string): boolean {
    return this.currentPhase.greenLanes.includes(laneId);
  }

  /** Advance the signal clock by dt seconds. */
  update(dt: number): void {
    this.elapsed += dt;
    if (this.elapsed >= this.currentPhase.duration) {
      this.elapsed -= this.currentPhase.duration;
      this.phaseIndex = (this.phaseIndex + 1) % this.phases.length;
    }
  }

  /** Fraction of current phase elapsed (0–1), useful for rendering. */
  get phaseProgress(): number {
    return this.elapsed / this.currentPhase.duration;
  }
}
