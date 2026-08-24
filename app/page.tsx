'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import MetricsBar from '@/components/MetricsBar';
import TrafficCanvas from '@/components/TrafficCanvas';
import StreetmixEditor from '@/components/StreetmixEditor';
import IntersectionEditor from '@/components/IntersectionEditor';
import AdminEditor from '@/components/AdminEditor';
import { Engine } from '@/lib/simulation/Engine';
import { StorageManager } from '@/lib/storage/StorageManager';
import { PlayFile, StreetConfig, IntersectionConfig } from '@/lib/types/street';
import { SimulationTelemetry } from '@/lib/types/simulation';
import { SCENARIO_COMPLETE_STREET, DEFAULT_SCENARIOS } from '@/lib/storage/defaultScenarios';

export default function Home() {
  const [playFiles, setPlayFiles] = useState<PlayFile[]>(DEFAULT_SCENARIOS);
  const [activePlayFile, setActivePlayFile] = useState<PlayFile>(SCENARIO_COMPLETE_STREET);
  const [activeTab, setActiveTab] = useState<'simulation' | 'streetmix' | 'intersection' | 'admin'>('simulation');
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [timeOfDayHours, setTimeOfDayHours] = useState(8.0);
  const [telemetry, setTelemetry] = useState<SimulationTelemetry>({
    activeVehiclesCount: 0,
    vehiclesByType: { walker: 0, bike: 0, car: 0, truck: 0, delivery: 0, bus: 0, semi: 0 },
    throughputPerHour: 0,
    averageSpeedKmh: 0,
    totalCompletedTrips: 0,
    averageTravelTimeSeconds: 0,
    congestionIndex: 0,
  });

  const engineRef = useRef<Engine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new Engine(SCENARIO_COMPLETE_STREET);
  }

  // Load saved state from LocalStorage on mount
  useEffect(() => {
    const active = StorageManager.loadActivePlayFile();
    const allFiles = StorageManager.getAllPlayFiles();
    setPlayFiles(allFiles);
    setActivePlayFile(active);
    setTimeOfDayHours(active.initialTimeOfDayHours ?? 8.0);

    if (engineRef.current) {
      engineRef.current = new Engine(active);
    }

    // Periodic telemetry update (every 150ms)
    const interval = setInterval(() => {
      if (engineRef.current) {
        setTelemetry(engineRef.current.getTelemetry());
        setTimeOfDayHours(engineRef.current.clock.timeOfDayHours);
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  // Update scenario
  const handleSelectScenario = (scenario: PlayFile) => {
    setActivePlayFile(scenario);
    setTimeOfDayHours(scenario.initialTimeOfDayHours ?? 8.0);
    if (engineRef.current) {
      engineRef.current = new Engine(scenario);
      engineRef.current.clock.speedMultiplier = speedMultiplier;
      engineRef.current.clock.isPaused = isPaused;
    }
    StorageManager.saveActivePlayFile(scenario);
  };

  // Update street layout from Streetmix Editor
  const handleStreetChange = useCallback((updatedStreet: StreetConfig) => {
    if (!activePlayFile || !engineRef.current) return;
    const updatedPlayFile: PlayFile = {
      ...activePlayFile,
      street: updatedStreet,
    };
    setActivePlayFile(updatedPlayFile);
    engineRef.current.rebuildNetwork(updatedStreet, updatedPlayFile.intersections);
    StorageManager.saveActivePlayFile(updatedPlayFile);
  }, [activePlayFile]);

  // Update intersections
  const handleIntersectionChange = useCallback((updatedIntersections: IntersectionConfig[]) => {
    if (!activePlayFile || !engineRef.current) return;
    const updatedPlayFile: PlayFile = {
      ...activePlayFile,
      intersections: updatedIntersections,
    };
    setActivePlayFile(updatedPlayFile);
    engineRef.current.rebuildNetwork(updatedPlayFile.street, updatedIntersections);
    StorageManager.saveActivePlayFile(updatedPlayFile);
  }, [activePlayFile]);

  // Update entire play file from Admin Editor
  const handleAdminPlayFileChange = useCallback((updatedPlayFile: PlayFile) => {
    setActivePlayFile(updatedPlayFile);
    if (engineRef.current) {
      engineRef.current = new Engine(updatedPlayFile);
      engineRef.current.clock.speedMultiplier = speedMultiplier;
      engineRef.current.clock.isPaused = isPaused;
    }
    StorageManager.saveActivePlayFile(updatedPlayFile);
  }, [speedMultiplier, isPaused]);

  // Save custom scenario
  const handleSaveCustom = useCallback((name: string) => {
    if (!activePlayFile) return;
    const custom: PlayFile = {
      ...activePlayFile,
      id: `scenario_custom_${Date.now()}`,
      name: name || 'My Custom Scenario',
    };
    StorageManager.saveCustomPlayFile(custom);
    setPlayFiles(StorageManager.getAllPlayFiles());
    setActivePlayFile(custom);
  }, [activePlayFile]);

  // Controls
  const handleTogglePlay = () => {
    setIsPaused((prev) => {
      const next = !prev;
      if (engineRef.current) engineRef.current.clock.isPaused = next;
      return next;
    });
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.resetSimulation();
      setTelemetry(engineRef.current.getTelemetry());
    }
  };

  const handleSpeedChange = (speed: number) => {
    setSpeedMultiplier(speed);
    if (engineRef.current) {
      engineRef.current.clock.speedMultiplier = speed;
    }
  };

  const handleTimeOfDayChange = (hours: number) => {
    setTimeOfDayHours(hours);
    if (engineRef.current) {
      engineRef.current.clock.timeOfDayHours = hours;
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        playFiles={playFiles}
        activePlayFile={activePlayFile}
        onSelectScenario={handleSelectScenario}
        isPaused={isPaused}
        onTogglePlay={handleTogglePlay}
        onReset={handleReset}
        speedMultiplier={speedMultiplier}
        onSpeedChange={handleSpeedChange}
        timeOfDayHours={timeOfDayHours}
        onTimeOfDayChange={handleTimeOfDayChange}
      />

      {/* Real-time Telemetry HUD */}
      <MetricsBar telemetry={telemetry} />

      {/* Main Content Area */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Live 2D Traffic Viewport Canvas */}
        {engineRef.current && (
          <TrafficCanvas engine={engineRef.current} speedMultiplier={speedMultiplier} />
        )}

        {/* Tab Subviews */}
        {activeTab === 'streetmix' && (
          <StreetmixEditor street={activePlayFile.street} onChange={handleStreetChange} />
        )}

        {activeTab === 'intersection' && (
          <IntersectionEditor
            intersections={activePlayFile.intersections}
            lanes={activePlayFile.street.lanes}
            onChange={handleIntersectionChange}
          />
        )}

        {activeTab === 'admin' && (
          <AdminEditor
            playFile={activePlayFile}
            lanes={activePlayFile.street.lanes}
            onChange={handleAdminPlayFileChange}
            onSaveCustom={handleSaveCustom}
          />
        )}
      </div>
    </main>
  );
}
