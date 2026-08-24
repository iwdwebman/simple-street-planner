// Simulation Run-Time State & Telemetry Metrics

import { VehicleType } from './vehicle';

export interface SimulationTelemetry {
  activeVehiclesCount: number;
  vehiclesByType: Record<VehicleType, number>;
  throughputPerHour: number;
  averageSpeedKmh: number;
  totalCompletedTrips: number;
  averageTravelTimeSeconds: number;
  congestionIndex: number; // 0.0 (free flow) to 1.0 (gridlock)
}

export interface SimulationClock {
  timeOfDayHours: number; // e.g. 8.5 = 8:30 AM
  isPaused: boolean;
  speedMultiplier: number;
  elapsedSeconds: number;
}
