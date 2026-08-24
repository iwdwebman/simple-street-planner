// Traffic Signal Controller & Standard Phase Sequencer

import { SignalPhaseConfig, SignalPresetPattern, LaneDefinition } from '../types/street';

export type SignalLightColor = 'green' | 'yellow' | 'red';

export interface ActiveSignalPhase {
  name: string;
  greenLaneIds: string[];
  subState: SignalLightColor;
  timeInSubState: number;
  subStateDuration: number;
  totalPhaseDuration: number;
}

export class TrafficSignal {
  id: string;
  name: string;
  phases: SignalPhaseConfig[];
  currentPhaseIndex: number;
  subState: SignalLightColor; // 'green' | 'yellow' | 'red'
  elapsedInSubState: number;

  constructor(id: string, name: string, phases: SignalPhaseConfig[]) {
    this.id = id;
    this.name = name;
    this.phases = phases.length > 0 ? phases : TrafficSignal.createDefaultPhases([]);
    this.currentPhaseIndex = 0;
    this.subState = 'green';
    this.elapsedInSubState = 0;
  }

  get currentPhase(): SignalPhaseConfig {
    return this.phases[this.currentPhaseIndex] || this.phases[0];
  }

  /**
   * Get the current signal color for a given lane.
   */
  getSignalStateForLane(laneId: string): SignalLightColor {
    // If the lane is not in the signal's scope, it's always green (uncontrolled)
    const isControlled = this.phases.some((p) => p.greenLaneIds.includes(laneId));
    if (!isControlled) return 'green';

    const isCurrentGreenLane = this.currentPhase.greenLaneIds.includes(laneId);
    if (!isCurrentGreenLane) {
      return 'red';
    }

    return this.subState;
  }

  /**
   * Advance the signal state machine by dt seconds.
   */
  update(dt: number): void {
    if (this.phases.length === 0) return;
    this.elapsedInSubState += dt;

    const phase = this.currentPhase;

    if (this.subState === 'green') {
      if (this.elapsedInSubState >= phase.greenDuration) {
        this.elapsedInSubState = 0;
        this.subState = phase.yellowDuration > 0 ? 'yellow' : 'red';
      }
    } else if (this.subState === 'yellow') {
      if (this.elapsedInSubState >= phase.yellowDuration) {
        this.elapsedInSubState = 0;
        this.subState = phase.allRedDuration > 0 ? 'red' : 'green';
        if (this.subState === 'green') {
          this.advanceToNextPhase();
        }
      }
    } else if (this.subState === 'red') {
      if (this.elapsedInSubState >= phase.allRedDuration) {
        this.elapsedInSubState = 0;
        this.subState = 'green';
        this.advanceToNextPhase();
      }
    }
  }

  private advanceToNextPhase(): void {
    this.currentPhaseIndex = (this.currentPhaseIndex + 1) % this.phases.length;
  }

  /**
   * Returns current phase info and progress fraction (0..1)
   */
  getActivePhaseInfo(): ActiveSignalPhase {
    const phase = this.currentPhase;
    let duration = phase.greenDuration;
    if (this.subState === 'yellow') duration = phase.yellowDuration;
    if (this.subState === 'red') duration = phase.allRedDuration;

    const totalPhaseDuration = phase.greenDuration + phase.yellowDuration + phase.allRedDuration;

    return {
      name: phase.name,
      greenLaneIds: phase.greenLaneIds,
      subState: this.subState,
      timeInSubState: this.elapsedInSubState,
      subStateDuration: duration,
      totalPhaseDuration,
    };
  }

  /**
   * Generate standard phase patterns based on lane cross-section
   */
  static generatePresetPhases(
    pattern: SignalPresetPattern,
    lanes: LaneDefinition[],
  ): SignalPhaseConfig[] {
    const forwardMotorLanes = lanes
      .filter((l) => (l.type === 'motor' || l.type === 'transit') && l.direction === 'forward')
      .map((l) => l.id);

    const reverseMotorLanes = lanes
      .filter((l) => (l.type === 'motor' || l.type === 'transit') && l.direction === 'reverse')
      .map((l) => l.id);

    const turnLanes = lanes
      .filter((l) => l.type === 'turn_left' || l.type === 'turn_right' || l.type === 'center_turn')
      .map((l) => l.id);

    const pedLanes = lanes
      .filter((l) => l.type === 'sidewalk' || l.type === 'shared')
      .map((l) => l.id);

    switch (pattern) {
      case 'NS_EW_STANDARD':
        return [
          {
            id: 'phase_eb',
            name: 'Eastbound / Forward Green',
            greenLaneIds: forwardMotorLanes.length > 0 ? forwardMotorLanes : lanes.map((l) => l.id),
            greenDuration: 25,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_wb',
            name: 'Westbound / Reverse Green',
            greenLaneIds: reverseMotorLanes.length > 0 ? reverseMotorLanes : forwardMotorLanes,
            greenDuration: 25,
            yellowDuration: 3,
            allRedDuration: 2,
          },
        ];

      case 'PROTECTED_TURNS':
        return [
          {
            id: 'phase_through',
            name: 'Through Traffic Green',
            greenLaneIds: [...forwardMotorLanes, ...reverseMotorLanes],
            greenDuration: 25,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_turns',
            name: 'Protected Turn Arrows',
            greenLaneIds: turnLanes.length > 0 ? turnLanes : forwardMotorLanes,
            greenDuration: 15,
            yellowDuration: 3,
            allRedDuration: 2,
          },
        ];

      case 'SPLIT_PHASING':
        return [
          {
            id: 'phase_forward',
            name: 'Forward Approach Phase',
            greenLaneIds: forwardMotorLanes,
            greenDuration: 20,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_reverse',
            name: 'Reverse Approach Phase',
            greenLaneIds: reverseMotorLanes,
            greenDuration: 20,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_turns',
            name: 'Turn Bays Phase',
            greenLaneIds: turnLanes,
            greenDuration: 15,
            yellowDuration: 3,
            allRedDuration: 2,
          },
        ];

      case 'PEDESTRIAN_SCRAMBLE':
        return [
          {
            id: 'phase_motor',
            name: 'Vehicular Flow Phase',
            greenLaneIds: [...forwardMotorLanes, ...reverseMotorLanes, ...turnLanes],
            greenDuration: 30,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_ped',
            name: 'Pedestrian Scramble (All-Walk)',
            greenLaneIds: pedLanes,
            greenDuration: 20,
            yellowDuration: 2,
            allRedDuration: 2,
          },
        ];

      default:
        return TrafficSignal.createDefaultPhases(lanes.map((l) => l.id));
    }
  }

  static createDefaultPhases(laneIds: string[]): SignalPhaseConfig[] {
    return [
      {
        id: 'phase_main',
        name: 'Main Green Phase',
        greenLaneIds: laneIds,
        greenDuration: 30,
        yellowDuration: 3,
        allRedDuration: 2,
      },
    ];
  }
}
