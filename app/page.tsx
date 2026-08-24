'use client';

import React, { useState, useRef } from 'react';
import TrafficCanvas from '@/components/TrafficCanvas';
import ControlPanel from '@/components/ControlPanel';
import { Engine } from '@/lib/simulation/Engine';

export default function Home() {
  const engineRef = useRef<Engine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new Engine();
  }
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const engine = engineRef.current;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#111827',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
        gap: 16,
        fontFamily: 'monospace',
      }}
    >
      <header style={{ width: '100%', maxWidth: 1160, marginBottom: 4 }}>
        <h1 style={{ margin: 0, color: '#F9FAFB', fontSize: 22 }}>
          🛣️ 2D Street Traffic Simulator
        </h1>
        <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: 12 }}>
          Multi-modal cross-section · IDM car-following · Fixed-timestep physics
        </p>
      </header>

      <div
        style={{
          width: '100%',
          maxWidth: 1160,
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        <TrafficCanvas engine={engine} speedMultiplier={speedMultiplier} />
        <ControlPanel
          engine={engine}
          speedMultiplier={speedMultiplier}
          onSpeedChange={setSpeedMultiplier}
        />
      </div>
    </main>
  );
}
