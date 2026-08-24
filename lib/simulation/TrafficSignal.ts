// Traffic Signal Controller & Standard 4-Way Phase Sequencer with Pedestrian Walk Phases

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
   * Generate standard 4-way phase patterns with pedestrian walk phases
   */
  static generatePresetPhases(
    pattern: SignalPresetPattern,
    lanes: LaneDefinition[],
  ): SignalPhaseConfig[] {
    const ewMotor = lanes
      .filter((l) => (l.type === 'motor' || l.type === 'transit') && l.orientation !== 'vertical' && l.orientation !== 'turn')
      .map((l) => l.id);

    const nsMotor = lanes
      .filter((l) => (l.type === 'motor' || l.type === 'transit') && l.orientation === 'vertical')
      .map((l) => l.id);

    const nsPedestrians = ['ns_walk_sb', 'ns_walk_nb', 'walk_turn_n_w', 'walk_turn_n_e', 'walk_turn_s_e', 'walk_turn_s_w'];
    const ewPedestrians = ['sidewalk_eb', 'sidewalk_wb', 'walk_turn_w_s', 'walk_turn_w_n', 'walk_turn_e_n', 'walk_turn_e_s'];

    switch (pattern) {
      case 'NS_EW_STANDARD':
        return [
          {
            id: 'phase_ns',
            name: 'North-South Corridor Green & Walk',
            greenLaneIds: [
              ...nsMotor,
              'ns_travel_sb', 'ns_travel_nb', 'turn_n_w', 'turn_s_e',
              'ns_bike_sb', 'ns_bike_nb', ...nsPedestrians,
            ],
            greenDuration: 25,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_ew',
            name: 'East-West Boulevard Green & Walk',
            greenLaneIds: [
              ...ewMotor,
              'travel_eb_1', 'transit_eb', 'travel_wb_1', 'turn_w_s', 'turn_e_n',
              'bike_eb', 'bike_wb', ...ewPedestrians,
            ],
            greenDuration: 28,
            yellowDuration: 3,
            allRedDuration: 2,
          },
        ];

      case 'PROTECTED_TURNS':
        return [
          {
            id: 'phase_ns_through',
            name: 'North-South Through, Right & Walk',
            greenLaneIds: [
              ...nsMotor,
              'ns_travel_sb', 'ns_travel_nb', 'turn_n_w', 'turn_s_e',
              'ns_bike_sb', 'ns_bike_nb', ...nsPedestrians,
            ],
            greenDuration: 22,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_ns_lefts',
            name: 'North-South Protected Lefts',
            greenLaneIds: ['turn_n_e', 'turn_s_w'],
            greenDuration: 12,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_ew_through',
            name: 'East-West Through, Right & Walk',
            greenLaneIds: [
              ...ewMotor,
              'travel_eb_1', 'transit_eb', 'travel_wb_1', 'turn_w_s', 'turn_e_n',
              'bike_eb', 'bike_wb', ...ewPedestrians,
            ],
            greenDuration: 25,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_ew_lefts',
            name: 'East-West Protected Lefts',
            greenLaneIds: ['turn_w_n', 'turn_e_s'],
            greenDuration: 14,
            yellowDuration: 3,
            allRedDuration: 2,
          },
        ];

      case 'SPLIT_PHASING':
        return [
          {
            id: 'phase_north',
            name: 'North Approach Green (SB & Turns)',
            greenLaneIds: ['ns_travel_sb', 'turn_n_w', 'turn_n_e', 'ns_bike_sb', 'ns_walk_sb', 'walk_turn_n_w', 'walk_turn_n_e'],
            greenDuration: 18,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_south',
            name: 'South Approach Green (NB & Turns)',
            greenLaneIds: ['ns_travel_nb', 'turn_s_e', 'turn_s_w', 'ns_bike_nb', 'ns_walk_nb', 'walk_turn_s_e', 'walk_turn_s_w'],
            greenDuration: 18,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_west',
            name: 'West Approach Green (EB & Turns)',
            greenLaneIds: ['travel_eb_1', 'transit_eb', 'turn_w_s', 'turn_w_n', 'bike_eb', 'sidewalk_eb', 'walk_turn_w_s', 'walk_turn_w_n'],
            greenDuration: 20,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_east',
            name: 'East Approach Green (WB & Turns)',
            greenLaneIds: ['travel_wb_1', 'turn_e_n', 'turn_e_s', 'bike_wb', 'sidewalk_wb', 'walk_turn_e_n', 'walk_turn_e_s'],
            greenDuration: 20,
            yellowDuration: 3,
            allRedDuration: 2,
          },
        ];

      case 'PEDESTRIAN_SCRAMBLE':
        return [
          {
            id: 'phase_ns_traffic',
            name: 'North-South Traffic',
            greenLaneIds: ['ns_travel_sb', 'ns_travel_nb', 'turn_n_w', 'turn_s_e'],
            greenDuration: 24,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_ew_traffic',
            name: 'East-West Traffic',
            greenLaneIds: ['travel_eb_1', 'transit_eb', 'travel_wb_1', 'turn_w_s', 'turn_e_n'],
            greenDuration: 24,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_ped_scramble',
            name: 'Pedestrian Scramble (All-Walk Everywhere)',
            greenLaneIds: [
              ...nsPedestrians,
              ...ewPedestrians,
              'bike_eb', 'bike_wb', 'ns_bike_sb', 'ns_bike_nb',
            ],
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
