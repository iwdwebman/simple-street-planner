// Default Pre-Configured Play Files (Scenarios) with 5x 4-Way Perimeter Portals

import { PlayFile } from '../types/street';
import { DEFAULT_DIURNAL_PROFILE } from '../simulation/DemandManager';

export const SCENARIO_COMPLETE_STREET: PlayFile = {
  id: 'scenario_metropolis_crossroads',
  name: '🌆 Metropolis 4-Way Grand Crossroads (5x Map)',
  description: 'Expansive 5x multi-modal metropolitan intersection with ingress/outgress portals centered on North, South, East, and West perimeter sides.',
  version: '2.0.0',
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
    curvatureIntensity: 0.05,
    lanes: [
      // East-West Corridor (Horizontal)
      { id: 'sidewalk_eb', name: 'North Sidewalk EB', type: 'sidewalk', width: 2.8, direction: 'forward', orientation: 'horizontal', speedLimitKmh: 5 },
      { id: 'bike_eb', name: 'Protected Bike Lane EB', type: 'bike', width: 2.0, direction: 'forward', orientation: 'horizontal', speedLimitKmh: 20 },
      { id: 'travel_eb_1', name: 'Boulevard EB 1', type: 'motor', width: 3.4, direction: 'forward', orientation: 'horizontal', speedLimitKmh: 50 },
      { id: 'transit_eb', name: 'BRT Transit Center', type: 'transit', width: 3.6, direction: 'forward', orientation: 'horizontal', speedLimitKmh: 45 },
      { id: 'travel_wb_1', name: 'Boulevard WB 1', type: 'motor', width: 3.4, direction: 'reverse', orientation: 'horizontal', speedLimitKmh: 50 },
      { id: 'bike_wb', name: 'Protected Bike Lane WB', type: 'bike', width: 2.0, direction: 'reverse', orientation: 'horizontal', speedLimitKmh: 20 },
      { id: 'sidewalk_wb', name: 'South Sidewalk WB', type: 'sidewalk', width: 2.8, direction: 'reverse', orientation: 'horizontal', speedLimitKmh: 5 },

      // North-South Corridor (Vertical)
      { id: 'ns_walk_nb', name: 'West Avenue Sidewalk NB', type: 'sidewalk', width: 2.6, direction: 'reverse', orientation: 'vertical', speedLimitKmh: 5 },
      { id: 'ns_bike_nb', name: 'West Avenue Bike NB', type: 'bike', width: 2.0, direction: 'reverse', orientation: 'vertical', speedLimitKmh: 20 },
      { id: 'ns_travel_sb', name: 'Avenue Motor SB', type: 'motor', width: 3.4, direction: 'forward', orientation: 'vertical', speedLimitKmh: 45 },
      { id: 'ns_travel_nb', name: 'Avenue Motor NB', type: 'motor', width: 3.4, direction: 'reverse', orientation: 'vertical', speedLimitKmh: 45 },
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
      signalPattern: 'NS_EW_STANDARD',
      signalPhases: [
        {
          id: 'phase_ew',
          name: 'East-West Boulevard Green',
          greenLaneIds: ['travel_eb_1', 'transit_eb', 'travel_wb_1', 'bike_eb', 'bike_wb', 'sidewalk_eb', 'sidewalk_wb'],
          greenDuration: 28,
          yellowDuration: 3,
          allRedDuration: 2,
        },
        {
          id: 'phase_ns',
          name: 'North-South Avenue Green',
          greenLaneIds: ['ns_travel_sb', 'ns_travel_nb', 'ns_bike_nb', 'ns_bike_sb', 'ns_walk_nb', 'ns_walk_sb'],
          greenDuration: 22,
          yellowDuration: 3,
          allRedDuration: 2,
        },
      ],
    },
  ],
  ingressPoints: [
    // West Center Portal
    { id: 'ing_w_ped', name: 'West Portal Sidewalk EB', laneId: 'sidewalk_eb', positionMeters: 0, side: 'west' },
    { id: 'ing_w_bike', name: 'West Portal Bike EB', laneId: 'bike_eb', positionMeters: 0, side: 'west' },
    { id: 'ing_w_car', name: 'West Portal Motor EB', laneId: 'travel_eb_1', positionMeters: 0, side: 'west' },
    { id: 'ing_w_bus', name: 'West Portal Transit EB', laneId: 'transit_eb', positionMeters: 0, side: 'west' },

    // East Center Portal
    { id: 'ing_e_ped', name: 'East Portal Sidewalk WB', laneId: 'sidewalk_wb', positionMeters: 0, side: 'east' },
    { id: 'ing_e_bike', name: 'East Portal Bike WB', laneId: 'bike_wb', positionMeters: 0, side: 'east' },
    { id: 'ing_e_car', name: 'East Portal Motor WB', laneId: 'travel_wb_1', positionMeters: 0, side: 'east' },

    // North Center Portal
    { id: 'ing_n_ped', name: 'North Portal Sidewalk SB', laneId: 'ns_walk_sb', positionMeters: 0, side: 'north' },
    { id: 'ing_n_bike', name: 'North Portal Bike SB', laneId: 'ns_bike_sb', positionMeters: 0, side: 'north' },
    { id: 'ing_n_car', name: 'North Portal Motor SB', laneId: 'ns_travel_sb', positionMeters: 0, side: 'north' },

    // South Center Portal
    { id: 'ing_s_ped', name: 'South Portal Sidewalk NB', laneId: 'ns_walk_nb', positionMeters: 0, side: 'south' },
    { id: 'ing_s_bike', name: 'South Portal Bike NB', laneId: 'ns_bike_nb', positionMeters: 0, side: 'south' },
    { id: 'ing_s_car', name: 'South Portal Motor NB', laneId: 'ns_travel_nb', positionMeters: 0, side: 'south' },
  ],
  outgressPoints: [
    // East Center Outgress
    { id: 'out_e_ped', name: 'East Portal Sidewalk Exit', laneId: 'sidewalk_eb', positionMeters: 195, side: 'east' },
    { id: 'out_e_bike', name: 'East Portal Bike Exit', laneId: 'bike_eb', positionMeters: 195, side: 'east' },
    { id: 'out_e_car', name: 'East Portal Motor Exit', laneId: 'travel_eb_1', positionMeters: 195, side: 'east' },
    { id: 'out_e_bus', name: 'East Portal Transit Exit', laneId: 'transit_eb', positionMeters: 195, side: 'east' },

    // West Center Outgress
    { id: 'out_w_ped', name: 'West Portal Sidewalk Exit', laneId: 'sidewalk_wb', positionMeters: 195, side: 'west' },
    { id: 'out_w_bike', name: 'West Portal Bike Exit', laneId: 'bike_wb', positionMeters: 195, side: 'west' },
    { id: 'out_w_car', name: 'West Portal Motor Exit', laneId: 'travel_wb_1', positionMeters: 195, side: 'west' },

    // South Center Outgress
    { id: 'out_s_ped', name: 'South Portal Sidewalk Exit', laneId: 'ns_walk_sb', positionMeters: 145, side: 'south' },
    { id: 'out_s_bike', name: 'South Portal Bike Exit', laneId: 'ns_bike_sb', positionMeters: 145, side: 'south' },
    { id: 'out_s_car', name: 'South Portal Motor Exit', laneId: 'ns_travel_sb', positionMeters: 145, side: 'south' },

    // North Center Outgress
    { id: 'out_n_ped', name: 'North Portal Sidewalk Exit', laneId: 'ns_walk_nb', positionMeters: 145, side: 'north' },
    { id: 'out_n_bike', name: 'North Portal Bike Exit', laneId: 'ns_bike_nb', positionMeters: 145, side: 'north' },
    { id: 'out_n_car', name: 'North Portal Motor Exit', laneId: 'ns_travel_nb', positionMeters: 145, side: 'north' },
  ],
  demandRoutes: [
    // East-West Corridor Demand (West -> East)
    { id: 'r_w_ped', name: 'West -> East Walkers', originIngressId: 'ing_w_ped', destinationOutgressId: 'out_e_ped', vehicleType: 'walker', baseRatePerMinute: 22 },
    { id: 'r_w_bike', name: 'West -> East Cyclists', originIngressId: 'ing_w_bike', destinationOutgressId: 'out_e_bike', vehicleType: 'bike', baseRatePerMinute: 16 },
    { id: 'r_w_car', name: 'West -> East Commuter Cars', originIngressId: 'ing_w_car', destinationOutgressId: 'out_e_car', vehicleType: 'car', baseRatePerMinute: 18 },
    { id: 'r_w_bus', name: 'West -> East Express Bus', originIngressId: 'ing_w_bus', destinationOutgressId: 'out_e_bus', vehicleType: 'bus', baseRatePerMinute: 5 },
    { id: 'r_w_semi', name: 'West -> East Freight Semi', originIngressId: 'ing_w_car', destinationOutgressId: 'out_e_car', vehicleType: 'semi', baseRatePerMinute: 4 },

    // Westbound Corridor Demand (East -> West)
    { id: 'r_e_ped', name: 'East -> West Walkers', originIngressId: 'ing_e_ped', destinationOutgressId: 'out_w_ped', vehicleType: 'walker', baseRatePerMinute: 20 },
    { id: 'r_e_bike', name: 'East -> West Cyclists', originIngressId: 'ing_e_bike', destinationOutgressId: 'out_w_bike', vehicleType: 'bike', baseRatePerMinute: 14 },
    { id: 'r_e_car', name: 'East -> West Passenger Cars', originIngressId: 'ing_e_car', destinationOutgressId: 'out_w_car', vehicleType: 'car', baseRatePerMinute: 16 },
    { id: 'r_e_deliv', name: 'East -> West Delivery Vans', originIngressId: 'ing_e_car', destinationOutgressId: 'out_w_car', vehicleType: 'delivery', baseRatePerMinute: 10 },
    { id: 'r_e_truck', name: 'East -> West Utility Trucks', originIngressId: 'ing_e_car', destinationOutgressId: 'out_w_car', vehicleType: 'truck', baseRatePerMinute: 8 },

    // Southbound Corridor Demand (North -> South)
    { id: 'r_n_ped', name: 'North -> South Walkers', originIngressId: 'ing_n_ped', destinationOutgressId: 'out_s_ped', vehicleType: 'walker', baseRatePerMinute: 18 },
    { id: 'r_n_bike', name: 'North -> South Cyclists', originIngressId: 'ing_n_bike', destinationOutgressId: 'out_s_bike', vehicleType: 'bike', baseRatePerMinute: 12 },
    { id: 'r_n_car', name: 'North -> South Avenue Cars', originIngressId: 'ing_n_car', destinationOutgressId: 'out_s_car', vehicleType: 'car', baseRatePerMinute: 14 },
    { id: 'r_n_deliv', name: 'North -> South Delivery Vans', originIngressId: 'ing_n_car', destinationOutgressId: 'out_s_car', vehicleType: 'delivery', baseRatePerMinute: 8 },

    // Northbound Corridor Demand (South -> North)
    { id: 'r_s_ped', name: 'South -> North Walkers', originIngressId: 'ing_s_ped', destinationOutgressId: 'out_n_ped', vehicleType: 'walker', baseRatePerMinute: 18 },
    { id: 'r_s_bike', name: 'South -> North Cyclists', originIngressId: 'ing_s_bike', destinationOutgressId: 'out_n_bike', vehicleType: 'bike', baseRatePerMinute: 12 },
    { id: 'r_s_car', name: 'South -> North Avenue Cars', originIngressId: 'ing_s_car', destinationOutgressId: 'out_n_car', vehicleType: 'car', baseRatePerMinute: 14 },
    { id: 'r_s_truck', name: 'South -> North Medium Trucks', originIngressId: 'ing_s_car', destinationOutgressId: 'out_n_car', vehicleType: 'truck', baseRatePerMinute: 7 },
  ],
};

export const DEFAULT_SCENARIOS: PlayFile[] = [
  SCENARIO_COMPLETE_STREET,
];
