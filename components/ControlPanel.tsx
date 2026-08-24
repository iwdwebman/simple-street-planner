'use client';

import React from 'react';
import { Engine } from '@/lib/simulation/Engine';

interface ControlPanelProps {
  engine: Engine;
  speedMultiplier: number;
  onSpeedChange: (v: number) => void;
}

const SPEED_OPTIONS = [1, 5, 20] as const;

const DEMAND_LANES = [
  { id: 'sidewalk_eb', label: 'Sidewalk EB' },
  { id: 'bike_eb', label: 'Bike EB' },
  { id: 'travel_lane_1', label: 'Motor Lane 1' },
  { id: 'travel_lane_2', label: 'Motor Lane 2' },
  { id: 'center_turn_lane', label: 'Transit/Center' },
  { id: 'travel_lane_wb_1', label: 'Motor Lane WB1' },
  { id: 'travel_lane_wb_2', label: 'Motor Lane WB2' },
  { id: 'bike_wb', label: 'Bike WB' },
  { id: 'sidewalk_wb', label: 'Sidewalk WB' },
];

export default function ControlPanel({ engine, speedMultiplier, onSpeedChange }: ControlPanelProps) {
  const handleDemand = (laneId: string, value: string) => {
    engine.setDemandRate(laneId, parseFloat(value));
  };

  const handleSignalPhase = (phaseIndex: number, value: string) => {
    engine.setSignalPhaseDuration('main', phaseIndex, parseFloat(value));
  };

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        padding: '16px',
        background: '#1F2937',
        color: '#F9FAFB',
        fontFamily: 'monospace',
        fontSize: 12,
        overflowY: 'auto',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Speed Multiplier */}
      <section>
        <h3 style={{ margin: '0 0 8px', color: '#93C5FD', fontSize: 13 }}>⏩ Speed</h3>
        <div style={{ display: 'flex', gap: 6 }}>
          {SPEED_OPTIONS.map((v) => (
            <button
              key={v}
              onClick={() => onSpeedChange(v)}
              style={{
                padding: '4px 10px',
                background: speedMultiplier === v ? '#3B82F6' : '#374151',
                color: '#F9FAFB',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontWeight: speedMultiplier === v ? 700 : 400,
              }}
            >
              {v}x
            </button>
          ))}
        </div>
      </section>

      {/* Demand Rates */}
      <section>
        <h3 style={{ margin: '0 0 8px', color: '#6EE7B7', fontSize: 13 }}>🚗 Demand (veh/s)</h3>
        {DEMAND_LANES.map(({ id, label }) => {
          const profile = engine.spawnProfiles.find((p) => p.laneId === id);
          return (
            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ flexShrink: 0, marginRight: 4, color: '#D1D5DB' }}>{label}</label>
              <input
                type="number"
                min={0}
                max={2}
                step={0.05}
                defaultValue={profile?.rate ?? 0.2}
                onChange={(e) => handleDemand(id, e.target.value)}
                style={{
                  width: 60,
                  background: '#374151',
                  color: '#F9FAFB',
                  border: '1px solid #4B5563',
                  borderRadius: 3,
                  padding: '2px 4px',
                  fontFamily: 'monospace',
                  fontSize: 11,
                }}
              />
            </div>
          );
        })}
      </section>

      {/* Signal Timers */}
      <section>
        <h3 style={{ margin: '0 0 8px', color: '#FCD34D', fontSize: 13 }}>🚦 Signal Phases (s)</h3>
        {engine.signals[0]?.phases.map((phase, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ flexShrink: 0, marginRight: 4, color: '#D1D5DB' }}>{phase.name}</label>
            <input
              type="number"
              min={1}
              max={120}
              step={1}
              defaultValue={phase.duration}
              onChange={(e) => handleSignalPhase(i, e.target.value)}
              style={{
                width: 55,
                background: '#374151',
                color: '#F9FAFB',
                border: '1px solid #4B5563',
                borderRadius: 3,
                padding: '2px 4px',
                fontFamily: 'monospace',
                fontSize: 11,
              }}
            />
          </div>
        ))}
      </section>
    </aside>
  );
}
