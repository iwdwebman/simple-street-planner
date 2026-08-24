'use client';

import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Clock, Sliders, Layers, TrafficCone } from 'lucide-react';
import { PlayFile } from '@/lib/types/street';

interface NavbarProps {
  activeTab: 'simulation' | 'streetmix' | 'intersection' | 'admin';
  onTabChange: (tab: 'simulation' | 'streetmix' | 'intersection' | 'admin') => void;
  playFiles: PlayFile[];
  activePlayFile: PlayFile;
  onSelectScenario: (scenario: PlayFile) => void;
  isPaused: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  speedMultiplier: number;
  onSpeedChange: (speed: number) => void;
  timeOfDayHours: number;
  onTimeOfDayChange: (hours: number) => void;
}

const SPEED_OPTIONS = [1, 2, 5, 10, 20];

export default function Navbar({
  activeTab,
  onTabChange,
  playFiles,
  activePlayFile,
  onSelectScenario,
  isPaused,
  onTogglePlay,
  onReset,
  speedMultiplier,
  onSpeedChange,
  timeOfDayHours,
  onTimeOfDayChange,
}: NavbarProps) {
  // Format hours into 12-hour AM/PM string
  const formatTime = (h: number) => {
    const totalMinutes = Math.floor(h * 60) % 1440;
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <header className="navbar-container">
      {/* Brand & Scenario Selector */}
      <div className="navbar-brand-section">
        <div className="navbar-logo">
          <span className="logo-icon">🛣️</span>
          <div>
            <h1 className="logo-title">Simple Street Planner</h1>
            <span className="logo-subtitle">Multi-Modal Streetmix & Traffic Simulator</span>
          </div>
        </div>

        <div className="scenario-selector-wrapper">
          <select
            className="scenario-select"
            value={activePlayFile.id}
            onChange={(e) => {
              const selected = playFiles.find((p) => p.id === e.target.value);
              if (selected) onSelectScenario(selected);
            }}
          >
            {playFiles.map((pf) => (
              <option key={pf.id} value={pf.id}>
                {pf.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Playback & Time Controls */}
      <div className="navbar-controls-section">
        <div className="playback-group">
          <button
            className={`btn-icon ${isPaused ? 'btn-play' : 'btn-pause'}`}
            onClick={onTogglePlay}
            title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
            <span>{isPaused ? 'Play' : 'Pause'}</span>
          </button>

          <button className="btn-icon btn-secondary" onClick={onReset} title="Reset Simulation">
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>
        </div>

        {/* Speed Buttons */}
        <div className="speed-group">
          <FastForward size={14} className="speed-icon" />
          {SPEED_OPTIONS.map((spd) => (
            <button
              key={spd}
              className={`btn-speed ${speedMultiplier === spd ? 'active' : ''}`}
              onClick={() => onSpeedChange(spd)}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Time of Day Clock & Scrubber */}
        <div className="time-scrubber-group">
          <div className="time-display">
            <Clock size={14} />
            <span className="time-text">{formatTime(timeOfDayHours)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={24}
            step={0.1}
            value={timeOfDayHours}
            onChange={(e) => onTimeOfDayChange(parseFloat(e.target.value))}
            className="time-slider"
            title="Drag to simulate different hours of the day"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="navbar-tabs">
        <button
          className={`nav-tab ${activeTab === 'simulation' ? 'active' : ''}`}
          onClick={() => onTabChange('simulation')}
        >
          <Layers size={15} />
          <span>Simulation</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'streetmix' ? 'active' : ''}`}
          onClick={() => onTabChange('streetmix')}
        >
          <Sliders size={15} />
          <span>Streetmix Editor</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'intersection' ? 'active' : ''}`}
          onClick={() => onTabChange('intersection')}
        >
          <TrafficCone size={15} />
          <span>Intersections</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => onTabChange('admin')}
        >
          <span>⚙️ Admin Demand</span>
        </button>
      </nav>
    </header>
  );
}
