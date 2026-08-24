'use client';

import React from 'react';
import { Trash2, CheckSquare, Square, Plus } from 'lucide-react';
import {
  IntersectionConfig,
  IntersectionType,
  SignalPresetPattern,
  SignalPhaseConfig,
  LaneDefinition,
} from '@/lib/types/street';
import { TrafficSignal } from '@/lib/simulation/TrafficSignal';

interface IntersectionEditorProps {
  intersections: IntersectionConfig[];
  lanes: LaneDefinition[];
  onChange: (updatedIntersections: IntersectionConfig[]) => void;
}

const SIGNAL_PRESET_DESCRIPTIONS: Record<SignalPresetPattern, { label: string; desc: string }> = {
  NS_EW_STANDARD: {
    label: 'Standard Two-Way Alternating (EB / WB)',
    desc: 'Eastbound traffic gets green, then Westbound traffic gets green with yellow & red clearance.',
  },
  PROTECTED_TURNS: {
    label: 'Protected Left Turn Phases',
    desc: 'Through traffic gets green, followed by dedicated green arrows for turn bays.',
  },
  SPLIT_PHASING: {
    label: 'Split Approach Phasing',
    desc: 'Isolated sequential green phases for each travel approach.',
  },
  PEDESTRIAN_SCRAMBLE: {
    label: 'Pedestrian Scramble (All-Walk)',
    desc: 'Vehicular movement phase followed by an exclusive crosswalk phase for all pedestrians.',
  },
  CUSTOM: {
    label: 'Custom User-Defined Phase Timing',
    desc: 'Freely create and customize phase timings and green lane allocations.',
  },
};

export default function IntersectionEditor({
  intersections,
  lanes,
  onChange,
}: IntersectionEditorProps) {
  const activeIntersection = intersections[0] || {
    id: 'int_default',
    name: 'Primary Intersection',
    type: 'lights' as IntersectionType,
    positionMeters: 65,
    signalPattern: 'NS_EW_STANDARD' as SignalPresetPattern,
    signalPhases: TrafficSignal.generatePresetPhases('NS_EW_STANDARD', lanes),
  };

  const handleUpdate = (updates: Partial<IntersectionConfig>) => {
    const updated = [{ ...activeIntersection, ...updates }];
    onChange(updated);
  };

  const handleTypeChange = (type: IntersectionType) => {
    if (type === 'lights' && (!activeIntersection.signalPhases || activeIntersection.signalPhases.length === 0)) {
      handleUpdate({
        type,
        signalPattern: 'NS_EW_STANDARD',
        signalPhases: TrafficSignal.generatePresetPhases('NS_EW_STANDARD', lanes),
      });
    } else {
      handleUpdate({ type });
    }
  };

  const handlePresetChange = (pattern: SignalPresetPattern) => {
    const phases =
      pattern === 'CUSTOM'
        ? activeIntersection.signalPhases || TrafficSignal.createDefaultPhases(lanes.map((l) => l.id))
        : TrafficSignal.generatePresetPhases(pattern, lanes);

    handleUpdate({
      signalPattern: pattern,
      signalPhases: phases,
    });
  };

  const handleUpdatePhase = (phaseIndex: number, updates: Partial<SignalPhaseConfig>) => {
    const phases = [...(activeIntersection.signalPhases || [])];
    phases[phaseIndex] = { ...phases[phaseIndex], ...updates };
    handleUpdate({ signalPhases: phases, signalPattern: 'CUSTOM' });
  };

  const handleAddPhase = () => {
    const phases = [...(activeIntersection.signalPhases || [])];
    const newPhase: SignalPhaseConfig = {
      id: `phase_${Date.now()}`,
      name: `Custom Phase ${phases.length + 1}`,
      greenLaneIds: lanes.slice(0, 2).map((l) => l.id),
      greenDuration: 20,
      yellowDuration: 3,
      allRedDuration: 2,
    };
    phases.push(newPhase);
    handleUpdate({ signalPhases: phases, signalPattern: 'CUSTOM' });
  };

  const handleDeletePhase = (phaseIndex: number) => {
    const phases = (activeIntersection.signalPhases || []).filter((_: SignalPhaseConfig, i: number) => i !== phaseIndex);
    if (phases.length === 0) return;
    handleUpdate({ signalPhases: phases, signalPattern: 'CUSTOM' });
  };

  const toggleLaneInPhase = (phaseIndex: number, laneId: string) => {
    const phases = [...(activeIntersection.signalPhases || [])];
    const target = phases[phaseIndex];
    if (!target) return;

    const exists = target.greenLaneIds.includes(laneId);
    const newGreenLanes = exists
      ? target.greenLaneIds.filter((id: string) => id !== laneId)
      : [...target.greenLaneIds, laneId];

    phases[phaseIndex] = { ...target, greenLaneIds: newGreenLanes };
    handleUpdate({ signalPhases: phases, signalPattern: 'CUSTOM' });
  };

  const totalCycleSeconds = (activeIntersection.signalPhases || []).reduce(
    (acc: number, p: SignalPhaseConfig) => acc + p.greenDuration + p.yellowDuration + p.allRedDuration,
    0,
  );

  return (
    <div className="intersection-editor-panel">
      <div className="intersection-header">
        <div className="title-group">
          <h2>🚦 Intersection & Traffic Control Configurator</h2>
          <p>Configure intersection rules, priority merges, stop signs, and multi-phase traffic signal cycle timings.</p>
        </div>
      </div>

      {/* Control Type Selector (Merge vs Stop vs Lights) */}
      <div className="control-type-selector">
        <label className="section-label">Intersection Control Mode:</label>
        <div className="type-buttons">
          <button
            className={`btn-type ${activeIntersection.type === 'merge' ? 'active' : ''}`}
            onClick={() => handleTypeChange('merge')}
          >
            <span className="type-icon">🔄</span>
            <div>
              <strong>Priority Merge / Yield</strong>
              <small>Continuous movement with zipper merging</small>
            </div>
          </button>

          <button
            className={`btn-type ${activeIntersection.type === 'stop' ? 'active' : ''}`}
            onClick={() => handleTypeChange('stop')}
          >
            <span className="type-icon">🛑</span>
            <div>
              <strong>Stop Sign Control</strong>
              <small>Mandatory full stop with dwell pause</small>
            </div>
          </button>

          <button
            className={`btn-type ${activeIntersection.type === 'lights' ? 'active' : ''}`}
            onClick={() => handleTypeChange('lights')}
          >
            <span className="type-icon">🚦</span>
            <div>
              <strong>Traffic Signal Lights</strong>
              <small>Coordinated multi-phase green/yellow/red cycles</small>
            </div>
          </button>
        </div>
      </div>

      {/* Stop Sign Settings */}
      {activeIntersection.type === 'stop' && (
        <div className="editor-subpanel">
          <h3>🛑 Stop Sign Configuration</h3>
          <div className="setting-row">
            <label>Required Stop Dwell Pause (seconds):</label>
            <div className="setting-input-group">
              <input
                type="range"
                min={1.0}
                max={5.0}
                step={0.5}
                value={activeIntersection.stopDwellSeconds ?? 2.0}
                onChange={(e) => handleUpdate({ stopDwellSeconds: parseFloat(e.target.value) })}
              />
              <span className="val-badge">{activeIntersection.stopDwellSeconds ?? 2.0} s</span>
            </div>
          </div>
        </div>
      )}

      {/* Traffic Signal Settings */}
      {activeIntersection.type === 'lights' && (
        <div className="editor-subpanel">
          <div className="signal-subpanel-header">
            <h3>🚦 Signal Cycle & Phase Programming</h3>
            <span className="cycle-badge">Total Cycle: {totalCycleSeconds}s</span>
          </div>

          {/* Standard Presets Selector */}
          <div className="preset-selector-box">
            <label>Standard Phase Template:</label>
            <select
              value={activeIntersection.signalPattern || 'NS_EW_STANDARD'}
              onChange={(e) => handlePresetChange(e.target.value as SignalPresetPattern)}
              className="select-input"
            >
              {(Object.keys(SIGNAL_PRESET_DESCRIPTIONS) as SignalPresetPattern[]).map((k) => {
                const info = SIGNAL_PRESET_DESCRIPTIONS[k];
                return (
                  <option key={k} value={k}>
                    {info.label}
                  </option>
                );
              })}
            </select>
            <small className="preset-hint">
              {SIGNAL_PRESET_DESCRIPTIONS[activeIntersection.signalPattern || 'NS_EW_STANDARD']?.desc}
            </small>
          </div>

          {/* Phases List */}
          <div className="phases-list">
            {(activeIntersection.signalPhases || []).map((phase: SignalPhaseConfig, pIdx: number) => (
              <div key={phase.id || pIdx} className="phase-card">
                <div className="phase-card-header">
                  <div className="phase-num-badge">Phase #{pIdx + 1}</div>
                  <input
                    type="text"
                    value={phase.name}
                    onChange={(e) => handleUpdatePhase(pIdx, { name: e.target.value })}
                    className="phase-name-input"
                  />
                  {(activeIntersection.signalPhases?.length || 0) > 1 && (
                    <button
                      className="btn-tiny btn-danger"
                      onClick={() => handleDeletePhase(pIdx)}
                      title="Delete Phase"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                {/* Timings Row */}
                <div className="phase-timings-grid">
                  <div className="timing-box">
                    <label>🟢 Green (s):</label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={phase.greenDuration}
                      onChange={(e) => handleUpdatePhase(pIdx, { greenDuration: parseInt(e.target.value) || 5 })}
                      className="num-input"
                    />
                  </div>
                  <div className="timing-box">
                    <label>🟡 Yellow (s):</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={phase.yellowDuration}
                      onChange={(e) => handleUpdatePhase(pIdx, { yellowDuration: parseInt(e.target.value) || 1 })}
                      className="num-input"
                    />
                  </div>
                  <div className="timing-box">
                    <label>🔴 All-Red (s):</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={phase.allRedDuration}
                      onChange={(e) => handleUpdatePhase(pIdx, { allRedDuration: parseInt(e.target.value) || 0 })}
                      className="num-input"
                    />
                  </div>
                </div>

                {/* Green Lanes Multi-Select */}
                <div className="green-lanes-selection">
                  <label>Active Green Lanes during this Phase:</label>
                  <div className="lane-checkbox-tags">
                    {lanes.map((lane) => {
                      const isChecked = phase.greenLaneIds.includes(lane.id);
                      return (
                        <button
                          key={lane.id}
                          type="button"
                          className={`lane-tag-check ${isChecked ? 'active' : ''}`}
                          onClick={() => toggleLaneInPhase(pIdx, lane.id)}
                        >
                          {isChecked ? <CheckSquare size={13} /> : <Square size={13} />}
                          <span>{lane.name} ({lane.direction === 'reverse' ? 'WB' : 'EB'})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn-add-phase" onClick={handleAddPhase}>
            <Plus size={14} /> Add Additional Signal Phase
          </button>
        </div>
      )}
    </div>
  );
}
