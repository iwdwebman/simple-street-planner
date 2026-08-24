'use client';

import React from 'react';
import { Activity, Gauge, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SimulationTelemetry } from '@/lib/types/simulation';
import { VEHICLE_CONFIGS, VehicleType } from '@/lib/types/vehicle';

interface MetricsBarProps {
  telemetry: SimulationTelemetry;
}

export default function MetricsBar({ telemetry }: MetricsBarProps) {
  const getCongestionLevel = (idx: number) => {
    if (idx < 0.25) return { label: 'Free Flow', color: '#22C55E' };
    if (idx < 0.6) return { label: 'Moderate Flow', color: '#FACC15' };
    return { label: 'Heavy Congestion', color: '#EF4444' };
  };

  const congestion = getCongestionLevel(telemetry.congestionIndex);

  return (
    <div className="metrics-bar-container">
      {/* Vehicle Type Count Badges */}
      <div className="metrics-vehicles-group">
        <span className="metrics-group-label">Active Modes:</span>
        <div className="vehicle-badges-row">
          {(Object.keys(VEHICLE_CONFIGS) as VehicleType[]).map((vType) => {
            const meta = VEHICLE_CONFIGS[vType];
            const count = telemetry.vehiclesByType[vType] || 0;
            return (
              <div key={vType} className="vtype-badge" style={{ borderLeftColor: meta.color }}>
                <span className="vtype-name">{meta.label.split(' ')[0]}</span>
                <span className="vtype-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Telemetry Stats */}
      <div className="metrics-stats-group">
        {/* Total Active */}
        <div className="stat-card">
          <Activity size={14} className="stat-icon" />
          <div>
            <div className="stat-val">{telemetry.activeVehiclesCount}</div>
            <div className="stat-lbl">Active Agents</div>
          </div>
        </div>

        {/* Throughput Flow Rate */}
        <div className="stat-card">
          <span className="stat-icon-emoji">⚡</span>
          <div>
            <div className="stat-val">{telemetry.throughputPerHour}</div>
            <div className="stat-lbl">Flow (veh/hr)</div>
          </div>
        </div>

        {/* Average Speed */}
        <div className="stat-card">
          <Gauge size={14} className="stat-icon" />
          <div>
            <div className="stat-val">{telemetry.averageSpeedKmh.toFixed(1)} <small>km/h</small></div>
            <div className="stat-lbl">Avg Speed</div>
          </div>
        </div>

        {/* Total Completed Trips */}
        <div className="stat-card">
          <CheckCircle2 size={14} className="stat-icon" />
          <div>
            <div className="stat-val">{telemetry.totalCompletedTrips}</div>
            <div className="stat-lbl">Completed Trips</div>
          </div>
        </div>

        {/* Congestion Status */}
        <div className="stat-card congestion-card">
          <AlertTriangle size={14} style={{ color: congestion.color }} />
          <div>
            <div className="stat-val" style={{ color: congestion.color }}>
              {congestion.label}
            </div>
            <div className="stat-lbl">Network State</div>
          </div>
        </div>
      </div>
    </div>
  );
}
