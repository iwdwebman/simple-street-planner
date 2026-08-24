// Vehicle Types, IDM Parameters, and Dimensions with Tight Clumping for Walkers & Bikes

import { VehicleType as BaseVehicleType } from './vehicle';

export type VehicleType =
  | 'walker'
  | 'bike'
  | 'car'
  | 'truck'
  | 'delivery'
  | 'bus'
  | 'semi';

export interface IDMParameters {
  v0: number;      // Desired speed in free flow (m/s)
  aMax: number;    // Maximum acceleration (m/s^2)
  bComf: number;   // Comfortable deceleration (m/s^2)
  T: number;       // Safe time headway (seconds)
  s0: number;      // Minimum standstill jam gap (meters)
  length: number;  // Physical bumper-to-bumper vehicle length (meters)
  width: number;   // Physical vehicle width (meters)
}

export interface VehicleTypeMetadata {
  type: VehicleType;
  label: string;
  category: 'micro' | 'motor' | 'transit' | 'freight';
  defaultSpeedKmh: number;
  params: IDMParameters;
  color: string;
  allowedLaneTypes: string[];
}

export const VEHICLE_CONFIGS: Record<VehicleType, VehicleTypeMetadata> = {
  walker: {
    type: 'walker',
    label: 'Walker',
    category: 'micro',
    defaultSpeedKmh: 4.5,
    params: {
      v0: 1.25,      // ~4.5 km/h
      aMax: 1.0,
      bComf: 1.4,
      T: 0.45,       // Tight pedestrian spacing allows clumping in groups
      s0: 0.35,      // 35cm personal space when waiting
      length: 0.6,
      width: 0.6,
    },
    color: '#F97316',
    allowedLaneTypes: ['sidewalk', 'shared'],
  },
  bike: {
    type: 'bike',
    label: 'Bicycle / E-Bike',
    category: 'micro',
    defaultSpeedKmh: 16.0,
    params: {
      v0: 4.5,       // ~16 km/h
      aMax: 1.4,
      bComf: 2.0,
      T: 0.65,       // Tight cyclist spacing allows pack platooning
      s0: 0.70,      // 70cm standstill gap
      length: 1.8,
      width: 0.7,
    },
    color: '#10B981',
    allowedLaneTypes: ['bike', 'shared', 'motor'],
  },
  car: {
    type: 'car',
    label: 'Passenger Car',
    category: 'motor',
    defaultSpeedKmh: 50.0,
    params: {
      v0: 13.9,      // ~50 km/h
      aMax: 2.2,
      bComf: 2.5,
      T: 1.3,
      s0: 1.8,
      length: 4.6,
      width: 2.0,
    },
    color: '#3B82F6',
    allowedLaneTypes: ['motor', 'shared', 'turn_left', 'turn_right', 'center_turn'],
  },
  truck: {
    type: 'truck',
    label: 'Light / Medium Truck',
    category: 'freight',
    defaultSpeedKmh: 40.0,
    params: {
      v0: 11.1,      // ~40 km/h
      aMax: 1.5,
      bComf: 2.2,
      T: 1.5,
      s0: 2.2,
      length: 6.2,
      width: 2.2,
    },
    color: '#6366F1',
    allowedLaneTypes: ['motor', 'shared', 'turn_left', 'turn_right', 'center_turn'],
  },
  delivery: {
    type: 'delivery',
    label: 'Delivery Van',
    category: 'freight',
    defaultSpeedKmh: 35.0,
    params: {
      v0: 9.7,       // ~35 km/h
      aMax: 1.5,
      bComf: 2.0,
      T: 1.4,
      s0: 2.0,
      length: 6.8,
      width: 2.3,
    },
    color: '#8B5CF6',
    allowedLaneTypes: ['motor', 'transit', 'shared', 'turn_left', 'turn_right'],
  },
  bus: {
    type: 'bus',
    label: 'City Transit Bus',
    category: 'transit',
    defaultSpeedKmh: 32.0,
    params: {
      v0: 8.9,       // ~32 km/h
      aMax: 1.0,
      bComf: 1.6,
      T: 1.8,
      s0: 3.0,
      length: 12.5,
      width: 2.6,
    },
    color: '#EAB308',
    allowedLaneTypes: ['transit', 'motor', 'shared'],
  },
  semi: {
    type: 'semi',
    label: 'Semi / 18-Wheeler',
    category: 'freight',
    defaultSpeedKmh: 28.0,
    params: {
      v0: 7.8,       // ~28 km/h
      aMax: 0.7,
      bComf: 1.4,
      T: 2.2,
      s0: 4.0,
      length: 17.5,
      width: 2.8,
    },
    color: '#EF4444',
    allowedLaneTypes: ['motor'],
  },
};
