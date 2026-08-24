// Default Pre-Configured Play Files (Scenarios)

import { PlayFile } from '../types/street';
import { DEFAULT_DIURNAL_PROFILE } from '../simulation/DemandManager';

export const SCENARIO_COMPLETE_STREET: PlayFile = {
  id: 'scenario_complete_street',
  name: '🌆 Downtown Complete Street',
  description: 'Multi-modal urban corridor with protected bike lanes, dedicated transit, pedestrian walkways, and coordinated signals.',
  version: '1.0.0',
  lastModified: new Date().toISOString(),
  initialTimeOfDayHours: 8.0,
  timeOfDayProfile: DEFAULT_DIURNAL_PROFILE,
  street: {
    id: 'street_complete',
    name: 'Downtown Complete Street',
    streetType: 'arterial',
    lengthMeters: 85,
    curvatureIntensity: 0.1,
    lanes: [
      { id: 'sidewalk_eb', name: 'North Sidewalk', type: 'sidewalk', width: 2.8, direction: 'forward', speedLimitKmh: 5 },
      { id: 'bike_eb', name: 'Protected Bike Lane EB', type: 'bike', width: 2.0, direction: 'forward', speedLimitKmh: 20 },
      { id: 'travel_eb_1', name: 'Travel Lane EB', type: 'motor', width: 3.2, direction: 'forward', speedLimitKmh: 45, stopLineMeters: 70 },
      { id: 'transit_lane', name: 'Dedicated Transit Center', type: 'transit', width: 3.4, direction: 'forward', speedLimitKmh: 40 },
      { id: 'travel_wb_1', name: 'Travel Lane WB', type: 'motor', width: 3.2, direction: 'reverse', speedLimitKmh: 45, stopLineMeters: 70 },
      { id: 'bike_wb', name: 'Protected Bike Lane WB', type: 'bike', width: 2.0, direction: 'reverse', speedLimitKmh: 20 },
      { id: 'sidewalk_wb', name: 'South Sidewalk', type: 'sidewalk', width: 2.8, direction: 'reverse', speedLimitKmh: 5 },
    ],
  },
  intersections: [
    {
      id: 'signal_complete',
      name: 'Cross Street Signal',
      type: 'lights',
      positionMeters: 70,
      signalPattern: 'NS_EW_STANDARD',
      signalPhases: [
        { id: 'p1', name: 'Eastbound Flow', greenLaneIds: ['travel_eb_1'], greenDuration: 25, yellowDuration: 3, allRedDuration: 2 },
        { id: 'p2', name: 'Westbound Flow', greenLaneIds: ['travel_wb_1'], greenDuration: 25, yellowDuration: 3, allRedDuration: 2 },
      ],
    },
  ],
  ingressPoints: [
    { id: 'in_sw_eb', name: 'North Walkway In', laneId: 'sidewalk_eb', positionMeters: 0 },
    { id: 'in_bk_eb', name: 'Bike EB In', laneId: 'bike_eb', positionMeters: 0 },
    { id: 'in_tr_eb', name: 'Motor EB In', laneId: 'travel_eb_1', positionMeters: 0 },
    { id: 'in_bus', name: 'Transit In', laneId: 'transit_lane', positionMeters: 0 },
    { id: 'in_tr_wb', name: 'Motor WB In', laneId: 'travel_wb_1', positionMeters: 0 },
    { id: 'in_bk_wb', name: 'Bike WB In', laneId: 'bike_wb', positionMeters: 0 },
    { id: 'in_sw_wb', name: 'South Walkway In', laneId: 'sidewalk_wb', positionMeters: 0 },
  ],
  outgressPoints: [
    { id: 'out_sw_eb', name: 'North Walkway Out', laneId: 'sidewalk_eb', positionMeters: 85 },
    { id: 'out_bk_eb', name: 'Bike EB Out', laneId: 'bike_eb', positionMeters: 85 },
    { id: 'out_tr_eb', name: 'Motor EB Out', laneId: 'travel_eb_1', positionMeters: 85 },
    { id: 'out_bus', name: 'Transit Out', laneId: 'transit_lane', positionMeters: 85 },
    { id: 'out_tr_wb', name: 'Motor WB Out', laneId: 'travel_wb_1', positionMeters: 85 },
    { id: 'out_bk_wb', name: 'Bike WB Out', laneId: 'bike_wb', positionMeters: 85 },
    { id: 'out_sw_wb', name: 'South Walkway Out', laneId: 'sidewalk_wb', positionMeters: 85 },
  ],
  demandRoutes: [
    { id: 'r_ped_eb', name: 'Pedestrians EB', originIngressId: 'in_sw_eb', destinationOutgressId: 'out_sw_eb', vehicleType: 'walker', baseRatePerMinute: 20 },
    { id: 'r_ped_wb', name: 'Pedestrians WB', originIngressId: 'in_sw_wb', destinationOutgressId: 'out_sw_wb', vehicleType: 'walker', baseRatePerMinute: 20 },
    { id: 'r_bike_eb', name: 'Cyclists EB', originIngressId: 'in_bk_eb', destinationOutgressId: 'out_bk_eb', vehicleType: 'bike', baseRatePerMinute: 15 },
    { id: 'r_bike_wb', name: 'Cyclists WB', originIngressId: 'in_bk_wb', destinationOutgressId: 'out_bk_wb', vehicleType: 'bike', baseRatePerMinute: 15 },
    { id: 'r_car_eb', name: 'Cars EB', originIngressId: 'in_tr_eb', destinationOutgressId: 'out_tr_eb', vehicleType: 'car', baseRatePerMinute: 18 },
    { id: 'r_bus', name: 'Bus Transit', originIngressId: 'in_bus', destinationOutgressId: 'out_bus', vehicleType: 'bus', baseRatePerMinute: 4 },
    { id: 'r_car_wb', name: 'Cars & Vans WB', originIngressId: 'in_tr_wb', destinationOutgressId: 'out_tr_wb', vehicleType: 'delivery', baseRatePerMinute: 14 },
  ],
};

export const SCENARIO_LOGISTICS_CORRIDOR: PlayFile = {
  id: 'scenario_logistics_corridor',
  name: '🚛 Commercial Logistics Corridor',
  description: 'Heavy freight corridor featuring delivery vans, box trucks, and articulated 18-wheeler semi trucks with stop-sign intersection.',
  version: '1.0.0',
  lastModified: new Date().toISOString(),
  initialTimeOfDayHours: 10.0,
  timeOfDayProfile: DEFAULT_DIURNAL_PROFILE,
  street: {
    id: 'street_logistics',
    name: 'Industrial Freight Boulevard',
    streetType: 'collector',
    lengthMeters: 90,
    curvatureIntensity: -0.2, // reverse curve
    lanes: [
      { id: 'shoulder_eb', name: 'Loading Shoulder EB', type: 'parking', width: 2.6, direction: 'forward', speedLimitKmh: 20 },
      { id: 'freight_eb_1', name: 'Truck Lane EB 1', type: 'motor', width: 3.6, direction: 'forward', speedLimitKmh: 45, stopLineMeters: 75 },
      { id: 'freight_eb_2', name: 'Truck Lane EB 2', type: 'motor', width: 3.6, direction: 'forward', speedLimitKmh: 45, stopLineMeters: 75 },
      { id: 'turn_center', name: 'Center Turn Bay', type: 'center_turn', width: 3.4, direction: 'bidirectional', speedLimitKmh: 30 },
      { id: 'freight_wb_1', name: 'Truck Lane WB 1', type: 'motor', width: 3.6, direction: 'reverse', speedLimitKmh: 45, stopLineMeters: 75 },
      { id: 'freight_wb_2', name: 'Truck Lane WB 2', type: 'motor', width: 3.6, direction: 'reverse', speedLimitKmh: 45, stopLineMeters: 75 },
      { id: 'shoulder_wb', name: 'Loading Shoulder WB', type: 'parking', width: 2.6, direction: 'reverse', speedLimitKmh: 20 },
    ],
  },
  intersections: [
    {
      id: 'stop_industrial',
      name: 'Warehouse Gate All-Way Stop',
      type: 'stop',
      positionMeters: 75,
      stopDwellSeconds: 2.5,
    },
  ],
  ingressPoints: [
    { id: 'in_fr_eb1', name: 'Freight EB 1', laneId: 'freight_eb_1', positionMeters: 0 },
    { id: 'in_fr_eb2', name: 'Freight EB 2', laneId: 'freight_eb_2', positionMeters: 0 },
    { id: 'in_fr_wb1', name: 'Freight WB 1', laneId: 'freight_wb_1', positionMeters: 0 },
    { id: 'in_fr_wb2', name: 'Freight WB 2', laneId: 'freight_wb_2', positionMeters: 0 },
  ],
  outgressPoints: [
    { id: 'out_fr_eb1', name: 'Freight EB 1 Out', laneId: 'freight_eb_1', positionMeters: 90 },
    { id: 'out_fr_eb2', name: 'Freight EB 2 Out', laneId: 'freight_eb_2', positionMeters: 90 },
    { id: 'out_fr_wb1', name: 'Freight WB 1 Out', laneId: 'freight_wb_1', positionMeters: 90 },
    { id: 'out_fr_wb2', name: 'Freight WB 2 Out', laneId: 'freight_wb_2', positionMeters: 90 },
  ],
  demandRoutes: [
    { id: 'r_semi_eb', name: 'Articulated Semis EB', originIngressId: 'in_fr_eb1', destinationOutgressId: 'out_fr_eb1', vehicleType: 'semi', baseRatePerMinute: 8 },
    { id: 'r_deliv_eb', name: 'Delivery Vans EB', originIngressId: 'in_fr_eb2', destinationOutgressId: 'out_fr_eb2', vehicleType: 'delivery', baseRatePerMinute: 15 },
    { id: 'r_truck_wb', name: 'Medium Trucks WB', originIngressId: 'in_fr_wb1', destinationOutgressId: 'out_fr_wb1', vehicleType: 'truck', baseRatePerMinute: 12 },
    { id: 'r_semi_wb', name: 'Articulated Semis WB', originIngressId: 'in_fr_wb2', destinationOutgressId: 'out_fr_wb2', vehicleType: 'semi', baseRatePerMinute: 8 },
  ],
};

export const SCENARIO_WOONERF: PlayFile = {
  id: 'scenario_woonerf',
  name: '🏡 Shared Woonerf / Living Street',
  description: 'Ultra-low speed shared zone prioritizing pedestrians, families, cyclists, and quiet delivery vehicles with continuous merge traffic.',
  version: '1.0.0',
  lastModified: new Date().toISOString(),
  initialTimeOfDayHours: 14.0,
  timeOfDayProfile: DEFAULT_DIURNAL_PROFILE,
  street: {
    id: 'street_woonerf',
    name: 'Green Neighborhood Woonerf',
    streetType: 'shared',
    lengthMeters: 60,
    curvatureIntensity: 0.3, // winding aesthetic curve
    lanes: [
      { id: 'walkway_north', name: 'North Pedestrian Promenade', type: 'sidewalk', width: 3.5, direction: 'forward', speedLimitKmh: 5 },
      { id: 'shared_lane_1', name: 'Shared Living Carriageway', type: 'shared', width: 3.5, direction: 'forward', speedLimitKmh: 15 },
      { id: 'shared_lane_2', name: 'Shared Living Return Way', type: 'shared', width: 3.5, direction: 'reverse', speedLimitKmh: 15 },
      { id: 'walkway_south', name: 'South Garden Walkway', type: 'sidewalk', width: 3.5, direction: 'reverse', speedLimitKmh: 5 },
    ],
  },
  intersections: [
    {
      id: 'merge_woonerf',
      name: 'Plaza Priority Merge',
      type: 'merge',
      positionMeters: 30,
    },
  ],
  ingressPoints: [
    { id: 'in_w_n', name: 'North Walk In', laneId: 'walkway_north', positionMeters: 0 },
    { id: 'in_sh_1', name: 'Shared 1 In', laneId: 'shared_lane_1', positionMeters: 0 },
    { id: 'in_sh_2', name: 'Shared 2 In', laneId: 'shared_lane_2', positionMeters: 0 },
    { id: 'in_w_s', name: 'South Walk In', laneId: 'walkway_south', positionMeters: 0 },
  ],
  outgressPoints: [
    { id: 'out_w_n', name: 'North Walk Out', laneId: 'walkway_north', positionMeters: 60 },
    { id: 'out_sh_1', name: 'Shared 1 Out', laneId: 'shared_lane_1', positionMeters: 60 },
    { id: 'out_sh_2', name: 'Shared 2 Out', laneId: 'shared_lane_2', positionMeters: 60 },
    { id: 'out_w_s', name: 'South Walk Out', laneId: 'walkway_south', positionMeters: 60 },
  ],
  demandRoutes: [
    { id: 'r_ped_1', name: 'Strollers & Walkers North', originIngressId: 'in_w_n', destinationOutgressId: 'out_w_n', vehicleType: 'walker', baseRatePerMinute: 28 },
    { id: 'r_ped_2', name: 'Pedestrians South', originIngressId: 'in_w_s', destinationOutgressId: 'out_w_s', vehicleType: 'walker', baseRatePerMinute: 24 },
    { id: 'r_bike_sh', name: 'Neighborhood Bikes', originIngressId: 'in_sh_1', destinationOutgressId: 'out_sh_1', vehicleType: 'bike', baseRatePerMinute: 18 },
    { id: 'r_deliv_sh', name: 'Electric Delivery Van', originIngressId: 'in_sh_2', destinationOutgressId: 'out_sh_2', vehicleType: 'delivery', baseRatePerMinute: 5 },
  ],
};

export const DEFAULT_SCENARIOS: PlayFile[] = [
  SCENARIO_COMPLETE_STREET,
  SCENARIO_LOGISTICS_CORRIDOR,
  SCENARIO_WOONERF,
];
