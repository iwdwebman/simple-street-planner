// Unified Fixed-Timestep Multi-Modal Simulation Engine

import { Vehicle } from './Vehicle';
import { LaneSegment, buildNetworkFromConfig, evaluateBezierFull } from './Network';
import { TrafficSignal } from './TrafficSignal';
import { DemandManager, DEFAULT_DIURNAL_PROFILE } from './DemandManager';
import {
  StreetConfig,
  IntersectionConfig,
  PlayFile,
} from '../types/street';
import { SimulationTelemetry, SimulationClock } from '../types/simulation';
import { VehicleType, VEHICLE_CONFIGS } from '../types/vehicle';

export const FIXED_DT = 1 / 60; // 60 Hz physics

export class Engine {
  streetConfig: StreetConfig;
  intersections: IntersectionConfig[];
  lanes: Map<string, LaneSegment>;
  signals: TrafficSignal[];
  demandManager: DemandManager;
  clock: SimulationClock;

  // Telemetry accumulators
  completedTripsCount: number;
  totalTravelTimeAccum: number;
  recentTripSpeeds: number[];
  recentThroughputLog: { time: number; count: number }[];

  constructor(initialPlayFile?: PlayFile) {
    this.completedTripsCount = 0;
    this.totalTravelTimeAccum = 0;
    this.recentTripSpeeds = [];
    this.recentThroughputLog = [];

    this.clock = {
      timeOfDayHours: initialPlayFile?.initialTimeOfDayHours ?? 8.0, // 8:00 AM default
      isPaused: false,
      speedMultiplier: 1,
      elapsedSeconds: 0,
    };

    if (initialPlayFile) {
      this.streetConfig = initialPlayFile.street;
      this.intersections = initialPlayFile.intersections;
      const { lanes } = buildNetworkFromConfig(this.streetConfig);
      this.lanes = new Map(lanes.map((l) => [l.id, l]));

      this.signals = this.intersections
        .filter((i) => i.type === 'lights')
        .map((i) => new TrafficSignal(i.id, i.name, i.signalPhases || []));

      this.demandManager = new DemandManager(
        initialPlayFile.ingressPoints,
        initialPlayFile.outgressPoints,
        initialPlayFile.demandRoutes,
        initialPlayFile.timeOfDayProfile || DEFAULT_DIURNAL_PROFILE,
      );
    } else {
      // Create sensible default Complete Street layout
      this.streetConfig = Engine.createDefaultStreet();
      this.intersections = Engine.createDefaultIntersections(this.streetConfig);
      const { lanes } = buildNetworkFromConfig(this.streetConfig);
      this.lanes = new Map(lanes.map((l) => [l.id, l]));

      this.signals = this.intersections
        .filter((i) => i.type === 'lights')
        .map((i) => new TrafficSignal(i.id, i.name, i.signalPhases || []));

      const { ingress, outgress, routes } = Engine.createDefaultDemand(this.streetConfig);
      this.demandManager = new DemandManager(ingress, outgress, routes, DEFAULT_DIURNAL_PROFILE);
    }
  }

  /**
   * Rebuild the entire simulation network from updated street and intersection configs.
   * Preserves existing vehicles if their lanes still exist.
   */
  rebuildNetwork(street: StreetConfig, intersections: IntersectionConfig[]): void {
    this.streetConfig = street;
    this.intersections = intersections;

    const oldVehiclesByLane = new Map<string, Vehicle[]>();
    for (const [id, lane] of this.lanes.entries()) {
      oldVehiclesByLane.set(id, lane.vehicles);
    }

    const { lanes } = buildNetworkFromConfig(street);
    this.lanes = new Map();
    for (const lane of lanes) {
      // Restore existing vehicles if lane was retained
      if (oldVehiclesByLane.has(lane.id)) {
        lane.vehicles = oldVehiclesByLane.get(lane.id) || [];
      }
      this.lanes.set(lane.id, lane);
    }

    // Rebuild signals
    this.signals = intersections
      .filter((i) => i.type === 'lights')
      .map((i) => {
        const existing = this.signals.find((s) => s.id === i.id);
        if (existing && i.signalPhases && i.signalPhases.length > 0) {
          existing.phases = i.signalPhases;
          return existing;
        }
        return new TrafficSignal(i.id, i.name, i.signalPhases || []);
      });
  }

  /**
   * Reset simulation vehicles and telemetry metrics
   */
  resetSimulation(): void {
    for (const lane of this.lanes.values()) {
      lane.vehicles = [];
    }
    this.completedTripsCount = 0;
    this.totalTravelTimeAccum = 0;
    this.recentTripSpeeds = [];
    this.recentThroughputLog = [];
    this.clock.elapsedSeconds = 0;
  }

  /**
   * Single physics tick
   */
  private stepPhysics(dt: number): void {
    // 1. Advance signals
    for (const signal of this.signals) {
      signal.update(dt);
    }

    // 2. Advance time of day clock (e.g. 1 simulated second = 1 second in time of day)
    this.clock.elapsedSeconds += dt;
    this.clock.timeOfDayHours = (this.clock.timeOfDayHours + dt / 3600) % 24;

    // 3. Spawn demand
    this.demandManager.step(dt, this.clock.timeOfDayHours, this.lanes, this.clock.elapsedSeconds);

    // 4. Update vehicles in all lanes
    const activeIntersection = this.intersections[0]; // primary intersection along this segment

    for (const lane of this.lanes.values()) {
      // Sort vehicles ascending by position s
      lane.vehicles.sort((a, b) => a.s - b.s);

      // Determine signal/stop state for this lane
      let laneSignalState: 'green' | 'yellow' | 'red' = 'green';
      for (const signal of this.signals) {
        laneSignalState = signal.getSignalStateForLane(lane.id);
        if (laneSignalState !== 'green') break;
      }

      // Base design speed for this lane (in m/s)
      const baseLaneSpeedMs = (lane.speedLimitKmh || 50) / 3.6;

      for (let i = 0; i < lane.vehicles.length; i++) {
        const v = lane.vehicles[i];
        const tPos = Math.max(0, Math.min(1, v.s / Math.max(1, lane.length)));

        // Calculate local curve safe speed
        const curveEval = evaluateBezierFull(lane.curve, tPos);
        const curveSafeSpeed = curveEval.maxSafeSpeed;

        // Effective target speed: min(v0, laneSpeed, curveSafeSpeed)
        const targetSpeed = Math.min(v.v0, baseLaneSpeedMs, curveSafeSpeed);

        // Leader vehicle
        let sLead = Infinity;
        let vLead = targetSpeed;

        if (i + 1 < lane.vehicles.length) {
          const leader = lane.vehicles[i + 1];
          sLead = leader.s;
          vLead = leader.v;
        }

        // Virtual stop line obstacle (for red lights or stop signs)
        if (lane.stopLine !== undefined && v.s < lane.stopLine) {
          const stopLineS = lane.stopLine;

          if (activeIntersection?.type === 'lights') {
            // Signal light stop line
            if (laneSignalState === 'red' || (laneSignalState === 'yellow' && v.s < stopLineS - 15)) {
              if (stopLineS < sLead) {
                sLead = stopLineS;
                vLead = 0;
              }
            }
          } else if (activeIntersection?.type === 'stop') {
            // Stop sign intersection
            const isAtStop = v.s >= stopLineS - 2.5 && v.s <= stopLineS + 1.0;
            const mustStop = v.updateStopState(dt, isAtStop, activeIntersection.stopDwellSeconds ?? 2.0);

            if (mustStop && stopLineS < sLead) {
              sLead = stopLineS;
              vLead = 0;
            }
          }
        }

        const acc = v.computeAcceleration(sLead, vLead, targetSpeed);
        v.integrate(dt, acc);
      }

      // Filter out vehicles that have exited the lane segment
      const exiting: Vehicle[] = [];
      lane.vehicles = lane.vehicles.filter((v) => {
        if (v.s >= lane.length) {
          exiting.push(v);
          return false;
        }
        return true;
      });

      // Record completed trip metrics
      for (const ex of exiting) {
        this.completedTripsCount++;
        const travelTime = Math.max(1, this.clock.elapsedSeconds - ex.spawnTime);
        this.totalTravelTimeAccum += travelTime;
        const avgSpeed = (ex.distanceTraveled / travelTime) * 3.6; // km/h
        this.recentTripSpeeds.push(avgSpeed);
        if (this.recentTripSpeeds.length > 50) this.recentTripSpeeds.shift();

        this.recentThroughputLog.push({
          time: this.clock.elapsedSeconds,
          count: 1,
        });
      }
    }

    // Prune throughput log older than 60 seconds
    const cutoff = this.clock.elapsedSeconds - 60;
    this.recentThroughputLog = this.recentThroughputLog.filter((log) => log.time >= cutoff);
  }

  /**
   * Advance simulation by multiplier ticks
   */
  update(multiplier = 1): void {
    if (this.clock.isPaused) return;
    const ticks = Math.max(1, Math.min(20, Math.round(multiplier)));
    for (let i = 0; i < ticks; i++) {
      this.stepPhysics(FIXED_DT);
    }
  }

  /**
   * Get real-time telemetry metrics
   */
  getTelemetry(): SimulationTelemetry {
    let activeCount = 0;
    const byType: Record<VehicleType, number> = {
      walker: 0,
      bike: 0,
      car: 0,
      truck: 0,
      delivery: 0,
      bus: 0,
      semi: 0,
    };

    let totalSpeedSum = 0;

    for (const lane of this.lanes.values()) {
      for (const v of lane.vehicles) {
        activeCount++;
        byType[v.type] = (byType[v.type] || 0) + 1;
        totalSpeedSum += v.v * 3.6; // km/h
      }
    }

    const throughputPerHour = this.recentThroughputLog.length * 60; // extrapolated hourly flow
    const avgSpeed = activeCount > 0 ? totalSpeedSum / activeCount : 0;
    const avgTravelTime =
      this.completedTripsCount > 0
        ? this.totalTravelTimeAccum / this.completedTripsCount
        : 0;

    // Congestion index: ratio of average speed to expected free-flow (50 km/h)
    const congestionIndex = Math.max(
      0,
      Math.min(1.0, 1.0 - (activeCount > 0 ? avgSpeed / 45 : 1.0)),
    );

    return {
      activeVehiclesCount: activeCount,
      vehiclesByType: byType,
      throughputPerHour,
      averageSpeedKmh: avgSpeed,
      totalCompletedTrips: this.completedTripsCount,
      averageTravelTimeSeconds: avgTravelTime,
      congestionIndex,
    };
  }

  // --- Default Scenario Constructors ---

  static createDefaultStreet(): StreetConfig {
    return {
      id: 'street_downtown_main',
      name: 'Downtown Complete Street',
      streetType: 'arterial',
      lengthMeters: 80,
      curvatureIntensity: 0.15, // gentle curve
      lanes: [
        {
          id: 'sidewalk_eb',
          name: 'North Sidewalk',
          type: 'sidewalk',
          width: 2.5,
          direction: 'forward',
          speedLimitKmh: 5,
        },
        {
          id: 'bike_eb',
          name: 'Protected Bike Lane EB',
          type: 'bike',
          width: 2.0,
          direction: 'forward',
          speedLimitKmh: 20,
        },
        {
          id: 'travel_eb_1',
          name: 'Travel Lane EB 1',
          type: 'motor',
          width: 3.2,
          direction: 'forward',
          speedLimitKmh: 45,
          stopLineMeters: 65,
        },
        {
          id: 'travel_eb_2',
          name: 'Travel Lane EB 2',
          type: 'motor',
          width: 3.2,
          direction: 'forward',
          speedLimitKmh: 45,
          stopLineMeters: 65,
        },
        {
          id: 'center_transit',
          name: 'Dedicated Bus Rapid Transit',
          type: 'transit',
          width: 3.5,
          direction: 'forward',
          speedLimitKmh: 40,
        },
        {
          id: 'travel_wb_1',
          name: 'Travel Lane WB 1',
          type: 'motor',
          width: 3.2,
          direction: 'reverse',
          speedLimitKmh: 45,
          stopLineMeters: 65,
        },
        {
          id: 'travel_wb_2',
          name: 'Travel Lane WB 2',
          type: 'motor',
          width: 3.2,
          direction: 'reverse',
          speedLimitKmh: 45,
          stopLineMeters: 65,
        },
        {
          id: 'bike_wb',
          name: 'Protected Bike Lane WB',
          type: 'bike',
          width: 2.0,
          direction: 'reverse',
          speedLimitKmh: 20,
        },
        {
          id: 'sidewalk_wb',
          name: 'South Sidewalk',
          type: 'sidewalk',
          width: 2.5,
          direction: 'reverse',
          speedLimitKmh: 5,
        },
      ],
    };
  }

  static createDefaultIntersections(street: StreetConfig): IntersectionConfig[] {
    const forwardMotor = street.lanes
      .filter((l) => l.type === 'motor' && l.direction === 'forward')
      .map((l) => l.id);
    const reverseMotor = street.lanes
      .filter((l) => l.type === 'motor' && l.direction === 'reverse')
      .map((l) => l.id);

    return [
      {
        id: 'signal_intersection_1',
        name: '4th Avenue Cross-Street Signal',
        type: 'lights',
        positionMeters: 65,
        signalPattern: 'NS_EW_STANDARD',
        signalPhases: [
          {
            id: 'phase_eb',
            name: 'Eastbound Green',
            greenLaneIds: forwardMotor,
            greenDuration: 25,
            yellowDuration: 3,
            allRedDuration: 2,
          },
          {
            id: 'phase_wb',
            name: 'Westbound Green',
            greenLaneIds: reverseMotor,
            greenDuration: 25,
            yellowDuration: 3,
            allRedDuration: 2,
          },
        ],
      },
    ];
  }

  static createDefaultDemand(street: StreetConfig) {
    const ingress = street.lanes.map((l) => ({
      id: `ingress_${l.id}`,
      name: `Enter ${l.name}`,
      laneId: l.id,
      positionMeters: 0,
    }));

    const outgress = street.lanes.map((l) => ({
      id: `outgress_${l.id}`,
      name: `Exit ${l.name}`,
      laneId: l.id,
      positionMeters: 80,
    }));

    const routes = [
      {
        id: 'route_ped_eb',
        name: 'Pedestrians North Walkway',
        originIngressId: 'ingress_sidewalk_eb',
        destinationOutgressId: 'outgress_sidewalk_eb',
        vehicleType: 'walker' as VehicleType,
        baseRatePerMinute: 18,
      },
      {
        id: 'route_ped_wb',
        name: 'Pedestrians South Walkway',
        originIngressId: 'ingress_sidewalk_wb',
        destinationOutgressId: 'outgress_sidewalk_wb',
        vehicleType: 'walker' as VehicleType,
        baseRatePerMinute: 18,
      },
      {
        id: 'route_bike_eb',
        name: 'Commuter Cyclists EB',
        originIngressId: 'ingress_bike_eb',
        destinationOutgressId: 'outgress_bike_eb',
        vehicleType: 'bike' as VehicleType,
        baseRatePerMinute: 12,
      },
      {
        id: 'route_bike_wb',
        name: 'Commuter Cyclists WB',
        originIngressId: 'ingress_bike_wb',
        destinationOutgressId: 'outgress_bike_wb',
        vehicleType: 'bike' as VehicleType,
        baseRatePerMinute: 12,
      },
      {
        id: 'route_car_eb1',
        name: 'Cars Eastbound #1',
        originIngressId: 'ingress_travel_eb_1',
        destinationOutgressId: 'outgress_travel_eb_1',
        vehicleType: 'car' as VehicleType,
        baseRatePerMinute: 16,
      },
      {
        id: 'route_car_eb2',
        name: 'Cars / Trucks EB #2',
        originIngressId: 'ingress_travel_eb_2',
        destinationOutgressId: 'outgress_travel_eb_2',
        vehicleType: 'truck' as VehicleType,
        baseRatePerMinute: 14,
      },
      {
        id: 'route_bus',
        name: 'Transit Bus Line',
        originIngressId: 'ingress_center_transit',
        destinationOutgressId: 'outgress_center_transit',
        vehicleType: 'bus' as VehicleType,
        baseRatePerMinute: 4,
      },
      {
        id: 'route_car_wb1',
        name: 'Delivery Vans WB #1',
        originIngressId: 'ingress_travel_wb_1',
        destinationOutgressId: 'outgress_travel_wb_1',
        vehicleType: 'delivery' as VehicleType,
        baseRatePerMinute: 12,
      },
      {
        id: 'route_semi_wb2',
        name: 'Commercial Semis WB #2',
        originIngressId: 'ingress_travel_wb_2',
        destinationOutgressId: 'outgress_travel_wb_2',
        vehicleType: 'semi' as VehicleType,
        baseRatePerMinute: 6,
      },
    ];

    return { ingress, outgress, routes };
  }
}
