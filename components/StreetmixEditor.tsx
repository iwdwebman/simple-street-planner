'use client';

import React from 'react';
import {
  Trash2,
  ArrowLeft,
  ArrowRight,
  Gauge,
  Maximize2,
  Compass,
} from 'lucide-react';
import { StreetConfig, LaneDefinition, LaneType, StreetType, STREET_TYPES } from '@/lib/types/street';

interface StreetmixEditorProps {
  street: StreetConfig;
  onChange: (updatedStreet: StreetConfig) => void;
}

const LANE_TYPE_OPTIONS: Array<{ type: LaneType; label: string; icon: string; defaultWidth: number }> = [
  { type: 'sidewalk', label: 'Sidewalk / Walkway', icon: '🚶', defaultWidth: 2.5 },
  { type: 'bike', label: 'Protected Bike Lane', icon: '🚲', defaultWidth: 2.0 },
  { type: 'motor', label: 'General Travel Lane', icon: '🚗', defaultWidth: 3.2 },
  { type: 'transit', label: 'Bus / BRT Priority Lane', icon: '🚌', defaultWidth: 3.4 },
  { type: 'parking', label: 'Parking / Loading Shoulder', icon: '🅿️', defaultWidth: 2.4 },
  { type: 'turn_left', label: 'Left Turn Pocket', icon: '⮢', defaultWidth: 3.0 },
  { type: 'turn_right', label: 'Right Turn Pocket', icon: '⮣', defaultWidth: 3.0 },
  { type: 'center_turn', label: 'Center Two-Way Turn Lane', icon: '⮂', defaultWidth: 3.4 },
  { type: 'median', label: 'Green Vegetative Median', icon: '🌳', defaultWidth: 2.0 },
  { type: 'shared', label: 'Shared Living Carriageway', icon: '🏡', defaultWidth: 3.5 },
];

export default function StreetmixEditor({ street, onChange }: StreetmixEditorProps) {
  const totalWidth = street.lanes.reduce((sum: number, l: LaneDefinition) => sum + l.width, 0);

  const handleUpdateLane = (index: number, updates: Partial<LaneDefinition>) => {
    const updatedLanes = [...street.lanes];
    updatedLanes[index] = { ...updatedLanes[index], ...updates };
    onChange({ ...street, lanes: updatedLanes });
  };

  const handleAddLane = (type: LaneType) => {
    const option = LANE_TYPE_OPTIONS.find((o) => o.type === type) || LANE_TYPE_OPTIONS[2];
    const newLane: LaneDefinition = {
      id: `lane_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: option.label,
      type: option.type,
      width: option.defaultWidth,
      direction: 'forward',
      speedLimitKmh: STREET_TYPES[street.streetType]?.baseSpeedKmh || 45,
    };
    onChange({ ...street, lanes: [...street.lanes, newLane] });
  };

  const handleDeleteLane = (index: number) => {
    if (street.lanes.length <= 1) return; // keep at least 1 lane
    const updatedLanes = street.lanes.filter((_: LaneDefinition, i: number) => i !== index);
    onChange({ ...street, lanes: updatedLanes });
  };

  const handleMoveLane = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= street.lanes.length) return;
    const updatedLanes = [...street.lanes];
    const temp = updatedLanes[index];
    updatedLanes[index] = updatedLanes[targetIndex];
    updatedLanes[targetIndex] = temp;
    onChange({ ...street, lanes: updatedLanes });
  };

  const handleStreetTypeChange = (type: StreetType) => {
    const meta = STREET_TYPES[type];
    onChange({
      ...street,
      streetType: type,
      lanes: street.lanes.map((l: LaneDefinition) => ({
        ...l,
        speedLimitKmh: meta.baseSpeedKmh,
      })),
    });
  };

  return (
    <div className="streetmix-editor-panel">
      {/* Top Header Controls */}
      <div className="streetmix-header">
        <div className="streetmix-title-group">
          <h2>🛣️ Streetmix Cross-Section Builder</h2>
          <p>Design your custom multi-modal street cross-section with interactive per-lane tools.</p>
        </div>

        <div className="streetmix-meta-controls">
          {/* Street Classification */}
          <div className="meta-control-box">
            <label>Street Type:</label>
            <select
              value={street.streetType}
              onChange={(e) => handleStreetTypeChange(e.target.value as StreetType)}
              className="select-input"
            >
              {(Object.keys(STREET_TYPES) as StreetType[]).map((k) => {
                const meta = STREET_TYPES[k];
                return (
                  <option key={k} value={k}>
                    {meta.label} ({meta.baseSpeedKmh} km/h)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Curvature Slider */}
          <div className="meta-control-box">
            <label>
              <Compass size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Curve Intensity: {((street.curvatureIntensity ?? 0) * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min={-0.8}
              max={0.8}
              step={0.05}
              value={street.curvatureIntensity ?? 0}
              onChange={(e) => onChange({ ...street, curvatureIntensity: parseFloat(e.target.value) })}
              className="slider-input"
            />
          </div>

          {/* Total Width Counter */}
          <div className="total-width-badge">
            <Maximize2 size={14} />
            <span>
              Total Width: <strong>{totalWidth.toFixed(1)} m</strong> ({(totalWidth * 3.28084).toFixed(1)} ft)
            </span>
          </div>
        </div>
      </div>

      {/* Streetmix Visual Cross-Section Strip */}
      <div className="streetmix-cross-section-container">
        <div className="cross-section-strip">
          {street.lanes.map((lane: LaneDefinition, index: number) => {
            const laneOption = LANE_TYPE_OPTIONS.find((o) => o.type === lane.type) || LANE_TYPE_OPTIONS[2];
            const widthPercentage = (lane.width / Math.max(1, totalWidth)) * 100;

            return (
              <div
                key={lane.id}
                className={`lane-card lane-card-${lane.type}`}
                style={{ flexBasis: `${Math.max(120, widthPercentage * 7)}px` }}
              >
                {/* Lane Top Reorder & Delete Bar */}
                <div className="lane-card-actions">
                  <button
                    className="btn-tiny"
                    onClick={() => handleMoveLane(index, 'left')}
                    disabled={index === 0}
                    title="Move Left (North)"
                  >
                    <ArrowLeft size={12} />
                  </button>
                  <span className="lane-index-pill">#{index + 1}</span>
                  <button
                    className="btn-tiny"
                    onClick={() => handleMoveLane(index, 'right')}
                    disabled={index === street.lanes.length - 1}
                    title="Move Right (South)"
                  >
                    <ArrowRight size={12} />
                  </button>
                  <button
                    className="btn-tiny btn-danger"
                    onClick={() => handleDeleteLane(index)}
                    title="Remove Lane"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Lane Visual Icon & Name */}
                <div className="lane-visual-icon">{laneOption.icon}</div>

                <input
                  type="text"
                  value={lane.name}
                  onChange={(e) => handleUpdateLane(index, { name: e.target.value })}
                  className="lane-name-input"
                />

                {/* Lane Type Selector */}
                <select
                  value={lane.type}
                  onChange={(e) => handleUpdateLane(index, { type: e.target.value as LaneType })}
                  className="lane-type-select"
                >
                  {LANE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.type} value={opt.type}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>

                {/* Width Controller */}
                <div className="lane-width-group">
                  <label>Width (m):</label>
                  <div className="width-stepper">
                    <button
                      className="btn-step"
                      onClick={() => handleUpdateLane(index, { width: Math.max(1.0, +(lane.width - 0.2).toFixed(1)) })}
                    >
                      -
                    </button>
                    <span className="width-val">{lane.width.toFixed(1)}m</span>
                    <button
                      className="btn-step"
                      onClick={() => handleUpdateLane(index, { width: Math.min(6.0, +(lane.width + 0.2).toFixed(1)) })}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Direction Toggle */}
                <div className="lane-dir-group">
                  <label>Direction:</label>
                  <div className="dir-buttons">
                    <button
                      className={`btn-dir ${lane.direction === 'forward' ? 'active' : ''}`}
                      onClick={() => handleUpdateLane(index, { direction: 'forward' })}
                      title="Forward (Eastbound / Northbound)"
                    >
                      <ArrowRight size={12} /> EB
                    </button>
                    <button
                      className={`btn-dir ${lane.direction === 'reverse' ? 'active' : ''}`}
                      onClick={() => handleUpdateLane(index, { direction: 'reverse' })}
                      title="Reverse (Westbound / Southbound)"
                    >
                      <ArrowLeft size={12} /> WB
                    </button>
                  </div>
                </div>

                {/* Speed Limit */}
                <div className="lane-speed-badge">
                  <Gauge size={12} />
                  <span>{lane.speedLimitKmh || 45} km/h</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Lane Toolbar */}
      <div className="add-lane-toolbar">
        <h3>+ Add Lane Component:</h3>
        <div className="add-lane-buttons">
          {LANE_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              className="btn-add-lane"
              onClick={() => handleAddLane(opt.type)}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
