'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { Engine } from '@/lib/simulation/Engine';
import { loadSprites } from '@/lib/renderer/SpriteManager';
import { drawRoads } from '@/lib/renderer/RoadRenderer';
import { evaluateBezier } from '@/lib/simulation/Network';

interface TrafficCanvasProps {
  engine: Engine;
  speedMultiplier: number;
}

export default function TrafficCanvas({ engine, speedMultiplier }: TrafficCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spritesRef = useRef<Record<string, ImageBitmap> | null>(null);
  const rafRef = useRef<number | null>(null);
  const multiplierRef = useRef(speedMultiplier);

  // Keep ref in sync without restarting loop
  useEffect(() => {
    multiplierRef.current = speedMultiplier;
  }, [speedMultiplier]);

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, sprites: Record<string, ImageBitmap>) => {
      const canvas = ctx.canvas;
      const lanes = Array.from(engine.lanes.values());
      const signals = engine.signals;

      // Advance simulation
      engine.update(multiplierRef.current);

      // Draw static geometry
      drawRoads(ctx, lanes, signals, canvas.width);

      // Draw vehicles
      for (const lane of lanes) {
        for (const vehicle of lane.vehicles) {
          const t = Math.min(1, Math.max(0, vehicle.s / lane.length));
          const { x, y, angle } = evaluateBezier(lane.curve, t);
          const sprite = sprites[vehicle.type];
          if (!sprite) continue;

          const scale = LANE_SCALE[lane.type] ?? 1;
          const w = sprite.width * scale;
          const h = sprite.height * scale;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
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

    loadSprites().then((sprites) => {
      if (cancelled) return;
      spritesRef.current = sprites;

      function loop() {
        if (cancelled) return;
        render(ctx!, sprites);
        rafRef.current = requestAnimationFrame(loop);
      }
      rafRef.current = requestAnimationFrame(loop);
    });

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [render]);

  // Pointer events for panning / zooming (viewport scaling placeholder)
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={600}
      style={{ display: 'block', width: '100%', maxWidth: 900, background: '#111827', borderRadius: 8 }}
      onWheel={handleWheel}
    />
  );
}

const LANE_SCALE: Record<string, number> = {
  motor: 1.0,
  bus: 1.0,
  bike: 0.8,
  pedestrian: 0.6,
  transit: 1.0,
};
