// Street, Lane, Intersection, Demand & PlayFile Types

import { VehicleType } from './vehicle';

export type LaneType =
  | 'sidewalk'
  | 'bike'
  | 'parking'
  | 'motor'
  | 'transit'
  | 'turn_left'
  | 'turn_right'
  | 'center_turn'
  | 'median'
  | 'shared';

export type LaneDirection = 'forward' | 'reverse' | 'bidirectional';

export interface LaneDefinition {
  id: string;
  name: string;
  type: LaneType;
  width: number;             // in meters (e.g., 3.0 m)
  direction: LaneDirection;  // forward (EB/NB), reverse (WB/SB), bidirectional
  speedLimitKmh?: number;    // optional custom speed limit
  stopLineMeters?: number;   // stop line distance from lane start (m)
}

export type StreetType =
  | 'shared'
  | 'residential'
  | 'collector'
  | 'arterial'
  | 'boulevard'
  | 'highway';

export interface StreetTypeMetadata {
  type: StreetType;
  label: string;
  description: string;
  baseSpeedKmh: number;
  defaultLaneWidth: number;
}

export const STREET_TYPES: Record<StreetType, StreetTypeMetadata> = {
  shared: {
    type: 'shared',
    label: 'Shared Street / Woonerf',
    description: 'Pedestrian-priority living street with ultra-low speed limit.',
    baseSpeedKmh: 15,
    defaultLaneWidth: 3.0,
  },
  residential: {
    type: 'residential',
    label: 'Residential Street',
    description: 'Local neighborhood road with parking and low vehicle speeds.',
    baseSpeedKmh: 30,
    defaultLaneWidth: 3.0,
  },
  collector: {
    type: 'collector',
    label: 'Collector Street',
    description: 'Medium capacity street channeling traffic to arterials.',
    baseSpeedKmh: 45,
    defaultLaneWidth: 3.2,
  },
  arterial: {
    type: 'arterial',
    label: 'Urban Arterial',
    description: 'High capacity thoroughfare with transit and turn lanes.',
    baseSpeedKmh: 60,
    defaultLaneWidth: 3.5,
  },
  boulevard: {
    type: 'boulevard',
    label: 'Multi-Way Boulevard',
    description: 'Scenic avenue with wide medians, protected bike paths & transit.',
    baseSpeedKmh: 50,
    defaultLaneWidth: 3.3,
  },
  highway: {
    type: 'highway',
    label: 'Expressway / Highway',
    description: 'High speed grade-separated multi-lane corridor.',
    baseSpeedKmh: 90,
    defaultLaneWidth: 3.7,
  },
};

export type IntersectionType = 'merge' | 'stop' | 'lights';

export interface SignalPhaseConfig {
  id: string;
  name: string;
  greenLaneIds: string[];
  yellowDuration: number;    // seconds (default ~3s)
  greenDuration: number;     // seconds
  allRedDuration: number;    // seconds (default ~2s)
}

export type SignalPresetPattern =
  | 'NS_EW_STANDARD'
  | 'PROTECTED_TURNS'
  | 'SPLIT_PHASING'
  | 'PEDESTRIAN_SCRAMBLE'
  | 'CUSTOM';

export interface IntersectionConfig {
  id: string;
  name: string;
  type: IntersectionType;
  positionMeters: number;    // distance along road network where intersection is located
  stopDwellSeconds?: number; // for 'stop' intersection (default 2.0s)
  signalPattern?: SignalPresetPattern;
  signalPhases?: SignalPhaseConfig[];
  currentPhaseIndex?: number;
}

export interface IngressPoint {
  id: string;
  name: string;
  laneId: string;
  positionMeters: number;    // spawn s position along lane (usually 0)
}

export interface OutgressPoint {
  id: string;
  name: string;
  laneId: string;
  positionMeters: number;    // exit s position along lane
}

export interface DemandRoute {
  id: string;
  name: string;
  originIngressId: string;
  destinationOutgressId: string;
  vehicleType: VehicleType;
  /** Base trips per minute at peak */
  baseRatePerMinute: number;
}

export interface HourlyDemandFactor {
  hour: number;  // 0 to 23
  factor: number; // 0.0 to 2.5 multiplier
}

export interface TimeOfDayProfile {
  name: string;
  hourlyFactors: number[]; // 24 values for hours 0..23
}

export interface StreetConfig {
  id: string;
  name: string;
  streetType: StreetType;
  lengthMeters: number;
  curveRadiusMeters?: number; // Infinity for straight, or e.g. 150m for curved
  curvatureIntensity?: number; // -1.0 to 1.0 (0 = straight)
  lanes: LaneDefinition[];
}

export interface PlayFile {
  id: string;
  name: string;
  description: string;
  version: string;
  lastModified: string;
  street: StreetConfig;
  intersections: IntersectionConfig[];
  ingressPoints: IngressPoint[];
  outgressPoints: OutgressPoint[];
  demandRoutes: DemandRoute[];
  timeOfDayProfile: TimeOfDayProfile;
  initialTimeOfDayHours: number; // e.g. 8.0 = 8:00 AM
}
