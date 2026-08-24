'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Engine } from '@/lib/simulation/Engine';
import { loadVehicleSprites } from '@/lib/renderer/SpriteManager';
import { drawRoads } from '@/lib/renderer/RoadRenderer';
import { evaluateBezierFull, PIXELS_PER_METER, LaneSegment } from '@/lib/simulation/Network';
import { VehicleType, VEHICLE_CONFIGS } from '@/lib/types/vehicle';
import { LaneDefinition } from '@/lib/types/street';

interface TrafficCanvasProps {
  engine: Engine;
  speedMultiplier: number;
}

interface HoveredVehicleInfo {
  id: number;
  type: VehicleType;
  speedKmh: number;
  accel: number;
  laneName: string;
  x: number;
  y: number;
}

export default function TrafficCanvas({ engine, speedMultiplier }: TrafficCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spritesRef = useRef<Record<VehicleType, ImageBitmap> | null>(null);
  const rafRef = useRef<number | null>(null);
  const multiplierRef = useRef(speedMultiplier);
  const [hoveredVehicle, setHoveredVehicle] = useState<HoveredVehicleInfo | null>(null);

  useEffect(() => {
    multiplierRef.current = speedMultiplier;
  }, [speedMultiplier]);

  const renderFrame = useCallback(
    (ctx: CanvasRenderingContext2D, sprites: Record<VehicleType, ImageBitmap>) => {
      const canvas = ctx.canvas;
      const lanes: LaneSegment[] = Array.from(engine.lanes.values());
      const signals = engine.signals;
      const intersections = engine.intersections;

      // 1. Advance simulation physics
      engine.update(multiplierRef.current);

      // 2. Draw static street pavement, striping, signals & markings
      drawRoads(ctx, lanes, signals, intersections, canvas.width, canvas.height);

      // 3. Draw All Vehicles
      for (const lane of lanes) {
        for (const vehicle of lane.vehicles) {
          const t = Math.max(0, Math.min(1, vehicle.s / Math.max(1, lane.length)));
          const { x, y, angle } = evaluateBezierFull(lane.curve, t);
          const sprite = sprites[vehicle.type];
          if (!sprite) continue;

          // Compute rendered sprite dimension based on physical meters
          const lengthPx = vehicle.length * PIXELS_PER_METER;
          const widthPx = vehicle.width * PIXELS_PER_METER;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);

          // Draw vehicle bitmap centered
          ctx.drawImage(sprite, -lengthPx / 2, -widthPx / 2, lengthPx, widthPx);

          // Subtle brake lights indicator when decelerating
          if (vehicle.a < -0.8) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
            ctx.shadowColor = '#EF4444';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(-lengthPx / 2, -widthPx / 3, 2, 0, Math.PI * 2);
            ctx.arc(-lengthPx / 2, widthPx / 3, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          ctx.restore();
        }
      }
    },
    [engine],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cancelled = false;

    loadVehicleSprites().then((sprites: Record<VehicleType, ImageBitmap>) => {
      if (cancelled) return;
      spritesRef.current = sprites;

      const loop = () => {
        if (cancelled) return;
        renderFrame(ctx, sprites);
        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    });

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [renderFrame]);

  // Mouse hover inspection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    let found: HoveredVehicleInfo | null = null;

    for (const lane of engine.lanes.values()) {
      for (const v of lane.vehicles) {
        const t = Math.max(0, Math.min(1, v.s / Math.max(1, lane.length)));
        const { x, y } = evaluateBezierFull(lane.curve, t);
        const dist = Math.hypot(mouseX - x, mouseY - y);
        if (dist < 18) {
          found = {
            id: v.id,
            type: v.type,
            speedKmh: v.v * 3.6,
            accel: v.a,
            laneName: lane.name,
            x: e.clientX,
            y: e.clientY,
          };
          break;
        }
      }
      if (found) break;
    }

    setHoveredVehicle(found);
  };

  const handleMouseLeave = () => {
    setHoveredVehicle(null);
  };

  // Compute dynamic canvas height based on lane layout
  const totalLanesHeightPx = engine.streetConfig.lanes.reduce(
    (sum: number, l: LaneDefinition) => sum + Math.max(24, Math.round(l.width * PIXELS_PER_METER)) + 2,
    60,
  );
  const canvasHeight = Math.max(480, totalLanesHeightPx + 40);

  return (
    <div className="traffic-canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={980}
        height={canvasHeight}
        className="traffic-canvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Tooltip on Hover */}
      {hoveredVehicle && (
        <div
          className="vehicle-tooltip"
          style={{ left: hoveredVehicle.x + 12, top: hoveredVehicle.y - 40 }}
        >
          <div className="tooltip-title">
            {VEHICLE_CONFIGS[hoveredVehicle.type]?.label} #{hoveredVehicle.id}
          </div>
          <div className="tooltip-row">
            <span>Speed:</span> <strong>{hoveredVehicle.speedKmh.toFixed(1)} km/h</strong>
          </div>
          <div className="tooltip-row">
            <span>Accel:</span> <strong>{hoveredVehicle.accel.toFixed(2)} m/s²</strong>
          </div>
          <div className="tooltip-row">
            <span>Lane:</span> <span>{hoveredVehicle.laneName}</span>
          </div>
        </div>
      )}
    </div>
  );
}
