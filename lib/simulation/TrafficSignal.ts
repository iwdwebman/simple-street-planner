// Traffic Signal Controller & 4-Stage Protected Turn Phasing with Opposing Right Turn Overlaps

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
  subState: SignalLightColor;
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
   * Generate 4-stage protected turn signal phases with opposing right-turn overlaps
   */
  static generatePresetPhases(
    pattern: SignalPresetPattern,
    lanes: LaneDefinition[],
  ): SignalPhaseConfig[] {
    const nsPedestrians = ['ns_walk_sb', 'ns_walk_nb', 'walk_turn_n_w', 'walk_turn_n_e', 'walk_turn_s_e', 'walk_turn_s_w'];
    const ewPedestrians = ['sidewalk_eb', 'sidewalk_wb', 'walk_turn_w_s', 'walk_turn_w_n', 'walk_turn_e_n', 'walk_turn_e_s'];

    switch (pattern) {
      case 'PROTECTED_TURNS':
      case 'NS_EW_STANDARD':
      default:
        return [
          {
            id: 'phase_ns_through',
            name: 'Stage 1/4: North-South Through, Right & Ped/Bike Walk',
            greenLaneIds: [
              'ns_travel_sb', 'ns_travel_nb', 'turn_right_sb', 'turn_right_nb',
              'ns_bike_sb', 'ns_bike_nb', ...nsPedestrians,
            ],
            greenDuration: 20,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_ns_lefts',
            name: 'Stage 2/4: North-South Protected Lefts & Opposing Rights',
            greenLaneIds: ['turn_left_sb', 'turn_left_nb', 'turn_right_sb', 'turn_right_nb'],
            greenDuration: 14,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_ew_through',
            name: 'Stage 3/4: East-West Through, Right & Ped/Bike Walk',
            greenLaneIds: [
              'travel_eb_1', 'transit_eb', 'travel_wb_1', 'turn_right_eb', 'turn_right_wb',
              'bike_eb', 'bike_wb', ...ewPedestrians,
            ],
            greenDuration: 22,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_ew_lefts',
            name: 'Stage 4/4: East-West Protected Lefts & Opposing Rights',
            greenLaneIds: ['turn_left_eb', 'turn_left_wb', 'turn_right_eb', 'turn_right_wb'],
            greenDuration: 14,
            yellowDuration: 3,
            allRedDuration: 2,
          },
        ];

      case 'SPLIT_PHASING':
        return [
          {
            id: 'phase_north',
            name: 'North Approach Green',
            greenLaneIds: ['ns_travel_sb', 'turn_left_sb', 'turn_right_sb', 'ns_bike_sb', 'ns_walk_sb'],
            greenDuration: 18,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_south',
            name: 'South Approach Green',
            greenLaneIds: ['ns_travel_nb', 'turn_left_nb', 'turn_right_nb', 'ns_bike_nb', 'ns_walk_nb'],
            greenDuration: 18,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_west',
            name: 'West Approach Green',
            greenLaneIds: ['travel_eb_1', 'transit_eb', 'turn_left_eb', 'turn_right_eb', 'bike_eb', 'sidewalk_eb'],
            greenDuration: 20,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_east',
            name: 'East Approach Green',
            greenLaneIds: ['travel_wb_1', 'turn_left_wb', 'turn_right_wb', 'bike_wb', 'sidewalk_wb'],
            greenDuration: 20,
            yellowDuration: 3,
            allRedDuration: 2,
          },
        ];
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
