// Default Pre-Configured Play Files with Dedicated Turn Bays & 4-Stage Protected Turn Cycles

import { PlayFile } from '../types/street';
import { DEFAULT_DIURNAL_PROFILE } from '../simulation/DemandManager';

export const SCENARIO_COMPLETE_STREET: PlayFile = {
  id: 'scenario_metropolis_crossroads',
  name: '🌆 Metropolis 4-Way Grand Crossroads (5x Map)',
  description: 'Expansive 5x metropolitan intersection with dedicated turn pocket lanes and 4-stage protected turn signal cycles in each direction.',
  version: '2.2.0',
  lastModified: new Date().toISOString(),
  initialTimeOfDayHours: 8.5,
  timeOfDayProfile: DEFAULT_DIURNAL_PROFILE,
  street: {
    id: 'street_metropolis',
    name: 'Metropolitan Boulevard & Grand Avenue Crossroads',
    streetType: 'boulevard',
    lengthMeters: 195,
    worldWidth: 3200,
    worldHeight: 2400,
    curvatureIntensity: 0.0,
    lanes: [
      // East-West Corridor (Horizontal)
      { id: 'sidewalk_eb', name: 'North Sidewalk EB', type: 'sidewalk', width: 2.8, direction: 'forward', orientation: 'horizontal', speedLimitKmh: 5 },
      { id: 'bike_eb', name: 'Protected Bike Lane EB', type: 'bike', width: 2.0, direction: 'forward', orientation: 'horizontal', speedLimitKmh: 20 },
      { id: 'travel_eb_1', name: 'Boulevard EB Through', type: 'motor', width: 3.4, direction: 'forward', orientation: 'horizontal', speedLimitKmh: 50 },
      { id: 'transit_eb', name: 'BRT Transit Center', type: 'transit', width: 3.6, direction: 'forward', orientation: 'horizontal', speedLimitKmh: 45 },
      { id: 'travel_wb_1', name: 'Boulevard WB Through', type: 'motor', width: 3.4, direction: 'reverse', orientation: 'horizontal', speedLimitKmh: 50 },
      { id: 'bike_wb', name: 'Protected Bike Lane WB', type: 'bike', width: 2.0, direction: 'reverse', orientation: 'horizontal', speedLimitKmh: 20 },
      { id: 'sidewalk_wb', name: 'South Sidewalk WB', type: 'sidewalk', width: 2.8, direction: 'reverse', orientation: 'horizontal', speedLimitKmh: 5 },

      // North-South Corridor (Vertical)
      { id: 'ns_walk_nb', name: 'West Avenue Sidewalk NB', type: 'sidewalk', width: 2.6, direction: 'reverse', orientation: 'vertical', speedLimitKmh: 5 },
      { id: 'ns_bike_nb', name: 'West Avenue Bike NB', type: 'bike', width: 2.0, direction: 'reverse', orientation: 'vertical', speedLimitKmh: 20 },
      { id: 'ns_travel_sb', name: 'Avenue Motor SB Through', type: 'motor', width: 3.4, direction: 'forward', orientation: 'vertical', speedLimitKmh: 45 },
      { id: 'ns_travel_nb', name: 'Avenue Motor NB Through', type: 'motor', width: 3.4, direction: 'reverse', orientation: 'vertical', speedLimitKmh: 45 },
      { id: 'ns_bike_sb', name: 'East Avenue Bike SB', type: 'bike', width: 2.0, direction: 'forward', orientation: 'vertical', speedLimitKmh: 20 },
      { id: 'ns_walk_sb', name: 'East Avenue Sidewalk SB', type: 'sidewalk', width: 2.6, direction: 'forward', orientation: 'vertical', speedLimitKmh: 5 },
    ],
  },
  intersections: [
    {
      id: 'signal_central_4way',
      name: 'Grand Central 4-Way Crossroads Signal',
      type: 'lights',
      positionMeters: 90,
      signalPattern: 'PROTECTED_TURNS',
      signalPhases: [
        {
          id: 'phase_ns_through',
          name: 'Stage 1/4: North-South Through & Right',
          greenLaneIds: [
            'ns_travel_sb', 'ns_travel_nb', 'turn_right_sb', 'turn_right_nb',
            'ns_bike_sb', 'ns_bike_nb',
            'ns_walk_sb', 'ns_walk_nb',
            'walk_turn_n_w', 'walk_turn_s_e',
          ],
          greenDuration: 20,
          yellowDuration: 3,
          allRedDuration: 2,
        },
        {
          id: 'phase_ns_lefts',
          name: 'Stage 2/4: North-South Protected Left Turns',
          greenLaneIds: ['turn_left_sb', 'turn_left_nb'],
          greenDuration: 14,
          yellowDuration: 3,
          allRedDuration: 2,
        },
        {
          id: 'phase_ew_through',
          name: 'Stage 3/4: East-West Through & Right',
          greenLaneIds: [
            'travel_eb_1', 'transit_eb', 'travel_wb_1', 'turn_right_eb', 'turn_right_wb',
            'bike_eb', 'bike_wb',
            'sidewalk_eb', 'sidewalk_wb',
            'walk_turn_w_s', 'walk_turn_e_n',
          ],
          greenDuration: 22,
          yellowDuration: 3,
          allRedDuration: 2,
        },
        {
          id: 'phase_ew_lefts',
          name: 'Stage 4/4: East-West Protected Left Turns',
          greenLaneIds: ['turn_left_eb', 'turn_left_wb'],
          greenDuration: 14,
          yellowDuration: 3,
          allRedDuration: 2,
        },
      ],
    },
  ],
  ingressPoints: [
    // West Center Portal
    { id: 'ing_w_ped', name: 'West Portal Sidewalk EB', laneId: 'sidewalk_eb', positionMeters: 0, side: 'west' },
    { id: 'ing_w_ped_turn_s', name: 'West Sidewalk Cross -> South', laneId: 'walk_turn_w_s', positionMeters: 0, side: 'west' },
    { id: 'ing_w_ped_turn_n', name: 'West Sidewalk Cross -> North', laneId: 'walk_turn_w_n', positionMeters: 0, side: 'west' },
    { id: 'ing_w_bike', name: 'West Portal Bike EB', laneId: 'bike_eb', positionMeters: 0, side: 'west' },
    { id: 'ing_w_car', name: 'West Portal Motor EB', laneId: 'travel_eb_1', positionMeters: 0, side: 'west' },
    { id: 'ing_w_bus', name: 'West Portal Transit EB', laneId: 'transit_eb', positionMeters: 0, side: 'west' },
    { id: 'ing_w_turn_left', name: 'West Portal Left Turn Pocket (EB -> NB)', laneId: 'turn_left_eb', positionMeters: 0, side: 'west' },
    { id: 'ing_w_turn_right', name: 'West Portal Right Turn Pocket (EB -> SB)', laneId: 'turn_right_eb', positionMeters: 0, side: 'west' },

    // East Center Portal
    { id: 'ing_e_ped', name: 'East Portal Sidewalk WB', laneId: 'sidewalk_wb', positionMeters: 0, side: 'east' },
    { id: 'ing_e_ped_turn_n', name: 'East Sidewalk Cross -> North', laneId: 'walk_turn_e_n', positionMeters: 0, side: 'east' },
    { id: 'ing_e_ped_turn_s', name: 'East Sidewalk Cross -> South', laneId: 'walk_turn_e_s', positionMeters: 0, side: 'east' },
    { id: 'ing_e_bike', name: 'East Portal Bike WB', laneId: 'bike_wb', positionMeters: 0, side: 'east' },
    { id: 'ing_e_car', name: 'East Portal Motor WB', laneId: 'travel_wb_1', positionMeters: 0, side: 'east' },
    { id: 'ing_e_turn_left', name: 'East Portal Left Turn Pocket (WB -> SB)', laneId: 'turn_left_wb', positionMeters: 0, side: 'east' },
    { id: 'ing_e_turn_right', name: 'East Portal Right Turn Pocket (WB -> NB)', laneId: 'turn_right_wb', positionMeters: 0, side: 'east' },

    // North Center Portal
    { id: 'ing_n_ped', name: 'North Portal Sidewalk SB', laneId: 'ns_walk_sb', positionMeters: 0, side: 'north' },
    { id: 'ing_n_ped_turn_w', name: 'North Sidewalk Cross -> West', laneId: 'walk_turn_n_w', positionMeters: 0, side: 'north' },
    { id: 'ing_n_ped_turn_e', name: 'North Sidewalk Cross -> East', laneId: 'walk_turn_n_e', positionMeters: 0, side: 'north' },
    { id: 'ing_n_bike', name: 'North Portal Bike SB', laneId: 'ns_bike_sb', positionMeters: 0, side: 'north' },
    { id: 'ing_n_car', name: 'North Portal Motor SB', laneId: 'ns_travel_sb', positionMeters: 0, side: 'north' },
    { id: 'ing_n_turn_left', name: 'North Portal Left Turn Pocket (SB -> EB)', laneId: 'turn_left_sb', positionMeters: 0, side: 'north' },
    { id: 'ing_n_turn_right', name: 'North Portal Right Turn Pocket (SB -> WB)', laneId: 'turn_right_sb', positionMeters: 0, side: 'north' },

    // South Center Portal
    { id: 'ing_s_ped', name: 'South Portal Sidewalk NB', laneId: 'ns_walk_nb', positionMeters: 0, side: 'south' },
    { id: 'ing_s_ped_turn_e', name: 'South Sidewalk Cross -> East', laneId: 'walk_turn_s_e', positionMeters: 0, side: 'south' },
    { id: 'ing_s_ped_turn_w', name: 'South Sidewalk Cross -> West', laneId: 'walk_turn_s_w', positionMeters: 0, side: 'south' },
    { id: 'ing_s_bike', name: 'South Portal Bike NB', laneId: 'ns_bike_nb', positionMeters: 0, side: 'south' },
    { id: 'ing_s_car', name: 'South Portal Motor NB', laneId: 'ns_travel_nb', positionMeters: 0, side: 'south' },
    { id: 'ing_s_turn_left', name: 'South Portal Left Turn Pocket (NB -> WB)', laneId: 'turn_left_nb', positionMeters: 0, side: 'south' },
    { id: 'ing_s_turn_right', name: 'South Portal Right Turn Pocket (NB -> EB)', laneId: 'turn_right_nb', positionMeters: 0, side: 'south' },
  ],
  outgressPoints: [
    // East Center Outgress
    { id: 'out_e_ped', name: 'East Portal Sidewalk Exit', laneId: 'sidewalk_eb', positionMeters: 195, side: 'east' },
    { id: 'out_e_ped_from_n', name: 'East Walk Exit (from North)', laneId: 'walk_turn_n_e', positionMeters: 195, side: 'east' },
    { id: 'out_e_ped_from_s', name: 'East Walk Exit (from South)', laneId: 'walk_turn_s_e', positionMeters: 195, side: 'east' },
    { id: 'out_e_bike', name: 'East Portal Bike Exit', laneId: 'bike_eb', positionMeters: 195, side: 'east' },
    { id: 'out_e_car', name: 'East Portal Motor Exit', laneId: 'travel_eb_1', positionMeters: 195, side: 'east' },
    { id: 'out_e_bus', name: 'East Portal Transit Exit', laneId: 'transit_eb', positionMeters: 195, side: 'east' },
    { id: 'out_e_left_from_sb', name: 'East Exit (Left Turn from SB)', laneId: 'turn_left_sb', positionMeters: 195, side: 'east' },
    { id: 'out_e_right_from_nb', name: 'East Exit (Right Turn from NB)', laneId: 'turn_right_nb', positionMeters: 195, side: 'east' },

    // West Center Outgress
    { id: 'out_w_ped', name: 'West Portal Sidewalk Exit', laneId: 'sidewalk_wb', positionMeters: 195, side: 'west' },
    { id: 'out_w_ped_from_n', name: 'West Walk Exit (from North)', laneId: 'walk_turn_n_w', positionMeters: 195, side: 'west' },
    { id: 'out_w_ped_from_s', name: 'West Walk Exit (from South)', laneId: 'walk_turn_s_w', positionMeters: 195, side: 'west' },
    { id: 'out_w_bike', name: 'West Portal Bike Exit', laneId: 'bike_wb', positionMeters: 195, side: 'west' },
    { id: 'out_w_car', name: 'West Portal Motor Exit', laneId: 'travel_wb_1', positionMeters: 195, side: 'west' },
    { id: 'out_w_left_from_nb', name: 'West Exit (Left Turn from NB)', laneId: 'turn_left_nb', positionMeters: 195, side: 'west' },
    { id: 'out_w_right_from_sb', name: 'West Exit (Right Turn from SB)', laneId: 'turn_right_sb', positionMeters: 195, side: 'west' },

    // South Center Outgress
    { id: 'out_s_ped', name: 'South Portal Sidewalk Exit', laneId: 'ns_walk_sb', positionMeters: 145, side: 'south' },
    { id: 'out_s_ped_from_w', name: 'South Walk Exit (from West)', laneId: 'walk_turn_w_s', positionMeters: 145, side: 'south' },
    { id: 'out_s_ped_from_e', name: 'South Walk Exit (from East)', laneId: 'walk_turn_e_s', positionMeters: 145, side: 'south' },
    { id: 'out_s_bike', name: 'South Portal Bike Exit', laneId: 'ns_bike_sb', positionMeters: 145, side: 'south' },
    { id: 'out_s_car', name: 'South Portal Motor Exit', laneId: 'ns_travel_sb', positionMeters: 145, side: 'south' },
    { id: 'out_s_left_from_wb', name: 'South Exit (Left Turn from WB)', laneId: 'turn_left_wb', positionMeters: 145, side: 'south' },
    { id: 'out_s_right_from_eb', name: 'South Exit (Right Turn from EB)', laneId: 'turn_right_eb', positionMeters: 145, side: 'south' },

    // North Center Outgress
    { id: 'out_n_ped', name: 'North Portal Sidewalk Exit', laneId: 'ns_walk_nb', positionMeters: 145, side: 'north' },
    { id: 'out_n_ped_from_w', name: 'North Walk Exit (from West)', laneId: 'walk_turn_w_n', positionMeters: 145, side: 'north' },
    { id: 'out_n_ped_from_e', name: 'North Walk Exit (from East)', laneId: 'walk_turn_e_n', positionMeters: 145, side: 'north' },
    { id: 'out_n_bike', name: 'North Portal Bike Exit', laneId: 'ns_bike_nb', positionMeters: 145, side: 'north' },
    { id: 'out_n_car', name: 'North Portal Motor Exit', laneId: 'ns_travel_nb', positionMeters: 145, side: 'north' },
    { id: 'out_n_left_from_eb', name: 'North Exit (Left Turn from EB)', laneId: 'turn_left_eb', positionMeters: 145, side: 'north' },
    { id: 'out_n_right_from_wb', name: 'North Exit (Right Turn from WB)', laneId: 'turn_right_wb', positionMeters: 145, side: 'north' },
  ],
  demandRoutes: [
    // --- 1. Through Movements ---
    { id: 'r_w_ped', name: 'West -> East Walkers', originIngressId: 'ing_w_ped', destinationOutgressId: 'out_e_ped', vehicleType: 'walker', baseRatePerMinute: 20 },
    { id: 'r_w_bike', name: 'West -> East Cyclists', originIngressId: 'ing_w_bike', destinationOutgressId: 'out_e_bike', vehicleType: 'bike', baseRatePerMinute: 16 },
    { id: 'r_w_car', name: 'West -> East Commuter Cars', originIngressId: 'ing_w_car', destinationOutgressId: 'out_e_car', vehicleType: 'car', baseRatePerMinute: 18 },
    { id: 'r_w_bus', name: 'West -> East Transit Bus', originIngressId: 'ing_w_bus', destinationOutgressId: 'out_e_bus', vehicleType: 'bus', baseRatePerMinute: 5 },
    { id: 'r_w_semi', name: 'West -> East Freight Semi', originIngressId: 'ing_w_car', destinationOutgressId: 'out_e_car', vehicleType: 'semi', baseRatePerMinute: 4 },

    { id: 'r_e_ped', name: 'East -> West Walkers', originIngressId: 'ing_e_ped', destinationOutgressId: 'out_w_ped', vehicleType: 'walker', baseRatePerMinute: 20 },
    { id: 'r_e_bike', name: 'East -> West Cyclists', originIngressId: 'ing_e_bike', destinationOutgressId: 'out_w_bike', vehicleType: 'bike', baseRatePerMinute: 16 },
    { id: 'r_e_car', name: 'East -> West Commuter Cars', originIngressId: 'ing_e_car', destinationOutgressId: 'out_w_car', vehicleType: 'car', baseRatePerMinute: 18 },
    { id: 'r_e_deliv', name: 'East -> West Delivery Vans', originIngressId: 'ing_e_car', destinationOutgressId: 'out_w_car', vehicleType: 'delivery', baseRatePerMinute: 10 },
    { id: 'r_e_truck', name: 'East -> West Medium Trucks', originIngressId: 'ing_e_car', destinationOutgressId: 'out_w_car', vehicleType: 'truck', baseRatePerMinute: 6 },

    { id: 'r_n_ped', name: 'North -> South Walkers', originIngressId: 'ing_n_ped', destinationOutgressId: 'out_s_ped', vehicleType: 'walker', baseRatePerMinute: 18 },
    { id: 'r_n_bike', name: 'North -> South Cyclists', originIngressId: 'ing_n_bike', destinationOutgressId: 'out_s_bike', vehicleType: 'bike', baseRatePerMinute: 14 },
    { id: 'r_n_car', name: 'North -> South Avenue Cars', originIngressId: 'ing_n_car', destinationOutgressId: 'out_s_car', vehicleType: 'car', baseRatePerMinute: 18 },
    { id: 'r_n_deliv', name: 'North -> South Delivery Vans', originIngressId: 'ing_n_car', destinationOutgressId: 'out_s_car', vehicleType: 'delivery', baseRatePerMinute: 8 },

    { id: 'r_s_ped', name: 'South -> North Walkers', originIngressId: 'ing_s_ped', destinationOutgressId: 'out_n_ped', vehicleType: 'walker', baseRatePerMinute: 18 },
    { id: 'r_s_bike', name: 'South -> North Cyclists', originIngressId: 'ing_s_bike', destinationOutgressId: 'out_n_bike', vehicleType: 'bike', baseRatePerMinute: 14 },
    { id: 'r_s_car', name: 'South -> North Avenue Cars', originIngressId: 'ing_s_car', destinationOutgressId: 'out_n_car', vehicleType: 'car', baseRatePerMinute: 18 },
    { id: 'r_s_truck', name: 'South -> North Medium Trucks', originIngressId: 'ing_s_car', destinationOutgressId: 'out_n_car', vehicleType: 'truck', baseRatePerMinute: 8 },

    // --- 2. Dedicated Left Turn Bay Movements (Protected Green Arrows) ---
    { id: 'r_turn_left_eb', name: 'Eastbound Protected Left Turn (EB -> NB)', originIngressId: 'ing_w_turn_left', destinationOutgressId: 'out_n_left_from_eb', vehicleType: 'car', baseRatePerMinute: 10 },
    { id: 'r_turn_left_eb_truck', name: 'Eastbound Left Turn (Trucks)', originIngressId: 'ing_w_turn_left', destinationOutgressId: 'out_n_left_from_eb', vehicleType: 'truck', baseRatePerMinute: 4 },

    { id: 'r_turn_left_wb', name: 'Westbound Protected Left Turn (WB -> SB)', originIngressId: 'ing_e_turn_left', destinationOutgressId: 'out_s_left_from_wb', vehicleType: 'car', baseRatePerMinute: 10 },
    { id: 'r_turn_left_wb_deliv', name: 'Westbound Left Turn (Delivery)', originIngressId: 'ing_e_turn_left', destinationOutgressId: 'out_s_left_from_wb', vehicleType: 'delivery', baseRatePerMinute: 6 },

    { id: 'r_turn_left_sb', name: 'Southbound Protected Left Turn (SB -> EB)', originIngressId: 'ing_n_turn_left', destinationOutgressId: 'out_e_left_from_sb', vehicleType: 'car', baseRatePerMinute: 10 },
    { id: 'r_turn_left_nb', name: 'Northbound Protected Left Turn (NB -> WB)', originIngressId: 'ing_s_turn_left', destinationOutgressId: 'out_w_left_from_nb', vehicleType: 'car', baseRatePerMinute: 10 },

    // --- 3. Dedicated Right Turn Bay Movements ---
    { id: 'r_turn_right_eb', name: 'Eastbound Right Turn (EB -> SB)', originIngressId: 'ing_w_turn_right', destinationOutgressId: 'out_s_right_from_eb', vehicleType: 'delivery', baseRatePerMinute: 8 },
    { id: 'r_turn_right_wb', name: 'Westbound Right Turn (WB -> NB)', originIngressId: 'ing_e_turn_right', destinationOutgressId: 'out_n_right_from_wb', vehicleType: 'car', baseRatePerMinute: 9 },
    { id: 'r_turn_right_sb', name: 'Southbound Right Turn (SB -> WB)', originIngressId: 'ing_n_turn_right', destinationOutgressId: 'out_w_right_from_sb', vehicleType: 'car', baseRatePerMinute: 9 },
    { id: 'r_turn_right_nb', name: 'Northbound Right Turn (NB -> EB)', originIngressId: 'ing_s_turn_right', destinationOutgressId: 'out_e_right_from_nb', vehicleType: 'car', baseRatePerMinute: 9 },

    // --- 4. Pedestrian Crosswalk Movements ---
    { id: 'r_ped_w_s', name: 'West -> South Crosswalk', originIngressId: 'ing_w_ped_turn_s', destinationOutgressId: 'out_s_ped_from_w', vehicleType: 'walker', baseRatePerMinute: 12 },
    { id: 'r_ped_w_n', name: 'West -> North Crosswalk', originIngressId: 'ing_w_ped_turn_n', destinationOutgressId: 'out_n_ped_from_w', vehicleType: 'walker', baseRatePerMinute: 10 },
    { id: 'r_ped_e_n', name: 'East -> North Crosswalk', originIngressId: 'ing_e_ped_turn_n', destinationOutgressId: 'out_n_ped_from_e', vehicleType: 'walker', baseRatePerMinute: 12 },
    { id: 'r_ped_e_s', name: 'East -> South Crosswalk', originIngressId: 'ing_e_ped_turn_s', destinationOutgressId: 'out_s_ped_from_e', vehicleType: 'walker', baseRatePerMinute: 10 },
    { id: 'r_ped_n_w', name: 'North -> West Crosswalk', originIngressId: 'ing_n_ped_turn_w', destinationOutgressId: 'out_w_ped_from_n', vehicleType: 'walker', baseRatePerMinute: 10 },
    { id: 'r_ped_n_e', name: 'North -> East Crosswalk', originIngressId: 'ing_n_ped_turn_e', destinationOutgressId: 'out_e_ped_from_n', vehicleType: 'walker', baseRatePerMinute: 12 },
    { id: 'r_ped_s_e', name: 'South -> East Crosswalk', originIngressId: 'ing_s_ped_turn_e', destinationOutgressId: 'out_e_ped_from_s', vehicleType: 'walker', baseRatePerMinute: 10 },
    { id: 'r_ped_s_w', name: 'South -> West Crosswalk', originIngressId: 'ing_s_ped_turn_w', destinationOutgressId: 'out_w_ped_from_s', vehicleType: 'walker', baseRatePerMinute: 12 },
  ],
};

export const DEFAULT_SCENARIOS: PlayFile[] = [
  SCENARIO_COMPLETE_STREET,
];
