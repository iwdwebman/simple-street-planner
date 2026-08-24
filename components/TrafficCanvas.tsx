'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react';
import { Engine } from '@/lib/simulation/Engine';
import { loadVehicleSprites } from '@/lib/renderer/SpriteManager';
import { drawRoads } from '@/lib/renderer/RoadRenderer';
import { evaluateLanePosition, PIXELS_PER_METER, LaneSegment, DEFAULT_WORLD_WIDTH, DEFAULT_WORLD_HEIGHT } from '@/lib/simulation/Network';
import { VehicleType, VEHICLE_CONFIGS } from '@/lib/types/vehicle';

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
  screenX: number;
  screenY: number;
}

const VEHICLE_RENDER_DIMENSIONS: Record<VehicleType, { length: number; width: number }> = {
  walker: { length: 12, width: 12 },
  bike: { length: 20, width: 9 },
  car: { length: 36, width: 16 },
  truck: { length: 44, width: 17 },
  delivery: { length: 48, width: 18 },
  bus: { length: 80, width: 18 },
  semi: { length: 105, width: 18 },
};

export default function TrafficCanvas({ engine, speedMultiplier }: TrafficCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const spritesRef = useRef<Record<VehicleType, ImageBitmap> | null>(null);
  const rafRef = useRef<number | null>(null);
  const multiplierRef = useRef(speedMultiplier);

  // Viewport Pan & Zoom camera state
  const [zoom, setZoom] = useState(0.42); // default fit view for 5x map
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredVehicle, setHoveredVehicle] = useState<HoveredVehicleInfo | null>(null);

  const worldWidth = engine.streetConfig.worldWidth || DEFAULT_WORLD_WIDTH;
  const worldHeight = engine.streetConfig.worldHeight || DEFAULT_WORLD_HEIGHT;

  useEffect(() => {
    multiplierRef.current = speedMultiplier;
  }, [speedMultiplier]);

  // Center camera on initial mount
  useEffect(() => {
    if (containerRef.current) {
      const containerW = containerRef.current.clientWidth || 1000;
      const containerH = 650;
      const initialZoom = Math.min(containerW / worldWidth, containerH / worldHeight) * 0.95;
      setZoom(initialZoom);
      setCamera({
        x: (containerW - worldWidth * initialZoom) / 2,
        y: (containerH - worldHeight * initialZoom) / 2,
      });
    }
  }, [worldWidth, worldHeight]);

  const renderFrame = useCallback(
    (ctx: CanvasRenderingContext2D, sprites: Record<VehicleType, ImageBitmap>) => {
      const canvas = ctx.canvas;
      const lanes: LaneSegment[] = Array.from(engine.lanes.values());
      const signals = engine.signals;
      const intersections = engine.intersections;

      // 1. Advance simulation physics
      engine.update(multiplierRef.current);

      // 2. Clear canvas
      ctx.fillStyle = '#090D16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. Apply Camera Viewport Transformation Matrix
      ctx.save();
      ctx.translate(camera.x, camera.y);
      ctx.scale(zoom, zoom);

      // 4. Draw static street pavement, striping, signals & 4-side portals
      drawRoads(ctx, lanes, signals, intersections, worldWidth, worldHeight);

      // 5. Draw All Active Vehicles
      for (const lane of lanes) {
        for (const vehicle of lane.vehicles) {
          const { x, y, angle } = evaluateLanePosition(lane, vehicle.s);
          const sprite = sprites[vehicle.type];
          if (!sprite) continue;

          const dims = VEHICLE_RENDER_DIMENSIONS[vehicle.type] || { length: 36, width: 16 };
          const lengthPx = dims.length;
          const widthPx = dims.width;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);

          // Draw vehicle bitmap
          ctx.drawImage(sprite, -lengthPx / 2, -widthPx / 2, lengthPx, widthPx);

          // Brake lights when decelerating
          if (vehicle.a < -0.8) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
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

      ctx.restore();

      // 6. Draw Minimap in Corner
      const miniCanvas = minimapCanvasRef.current;
      if (miniCanvas) {
        const mCtx = miniCanvas.getContext('2d');
        if (mCtx) {
          mCtx.fillStyle = '#090D16';
          mCtx.fillRect(0, 0, miniCanvas.width, miniCanvas.height);

          const scaleX = miniCanvas.width / worldWidth;
          const scaleY = miniCanvas.height / worldHeight;

          // Minimap roads
          mCtx.strokeStyle = '#334155';
          mCtx.lineWidth = 4;
          for (const lane of lanes) {
            const p0 = lane.curve.p0;
            const p3 = lane.curve.p3;
            mCtx.beginPath();
            mCtx.moveTo(p0.x * scaleX, p0.y * scaleY);
            mCtx.lineTo(p3.x * scaleX, p3.y * scaleY);
            mCtx.stroke();
          }

          // Minimap vehicles
          for (const lane of lanes) {
            for (const v of lane.vehicles) {
              const pt = evaluateLanePosition(lane, v.s);
              mCtx.fillStyle = VEHICLE_CONFIGS[v.type]?.color || '#3B82F6';
              mCtx.fillRect(pt.x * scaleX - 1.5, pt.y * scaleY - 1.5, 3, 3);
            }
          }

          // Viewport bounding box
          const viewWorldLeft = Math.max(0, -camera.x / zoom);
          const viewWorldTop = Math.max(0, -camera.y / zoom);
          const viewWorldW = Math.min(worldWidth, canvas.width / zoom);
          const viewWorldH = Math.min(worldHeight, canvas.height / zoom);

          mCtx.strokeStyle = '#38BDF8';
          mCtx.lineWidth = 1.5;
          mCtx.strokeRect(
            viewWorldLeft * scaleX,
            viewWorldTop * scaleY,
            viewWorldW * scaleX,
            viewWorldH * scaleY,
          );
        }
      }
    },
    [engine, camera, zoom, worldWidth, worldHeight],
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

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseCanvasX = e.clientX - rect.left;
    const mouseCanvasY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const nextZoom = Math.max(0.2, Math.min(3.0, zoom * zoomFactor));

    // Pin zoom to mouse position
    const nextCamX = mouseCanvasX - (mouseCanvasX - camera.x) * (nextZoom / zoom);
    const nextCamY = mouseCanvasY - (mouseCanvasY - camera.y) * (nextZoom / zoom);

    setZoom(nextZoom);
    setCamera({ x: nextCamX, y: nextCamY });
  };

  // Mouse drag pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - camera.x, y: e.clientY - camera.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setCamera({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // Vehicle hover detection in world coordinates
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Convert screen -> world coords
    const worldX = (screenX - camera.x) / zoom;
    const worldY = (screenY - camera.y) / zoom;

    let found: HoveredVehicleInfo | null = null;
    const hitRadius = 24 / zoom;

    for (const lane of engine.lanes.values()) {
      for (const v of lane.vehicles) {
        const { x, y } = evaluateLanePosition(lane, v.s);
        const dist = Math.hypot(worldX - x, worldY - y);
        if (dist < hitRadius) {
          found = {
            id: v.id,
            type: v.type,
            speedKmh: v.v * 3.6,
            accel: v.a,
            laneName: lane.name,
            screenX: e.clientX,
            screenY: e.clientY,
          };
          break;
        }
      }
      if (found) break;
    }

    setHoveredVehicle(found);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // On-screen Zoom Control Handlers
  const handleZoomIn = () => {
    const nextZoom = Math.min(3.0, zoom * 1.25);
    setZoom(nextZoom);
  };

  const handleZoomOut = () => {
    const nextZoom = Math.max(0.2, zoom * 0.8);
    setZoom(nextZoom);
  };

  const handleFitToScreen = () => {
    if (containerRef.current) {
      const containerW = containerRef.current.clientWidth || 1000;
      const containerH = 650;
      const fitZoom = Math.min(containerW / worldWidth, containerH / worldHeight) * 0.95;
      setZoom(fitZoom);
      setCamera({
        x: (containerW - worldWidth * fitZoom) / 2,
        y: (containerH - worldHeight * fitZoom) / 2,
      });
    }
  };

  const handleReset100 = () => {
    setZoom(1.0);
    if (containerRef.current) {
      const containerW = containerRef.current.clientWidth || 1000;
      const containerH = 650;
      setCamera({
        x: containerW / 2 - worldWidth / 2,
        y: containerH / 2 - worldHeight / 2,
      });
    }
  };

  return (
    <div ref={containerRef} className="traffic-canvas-wrapper" style={{ position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={1120}
        height={650}
        className="traffic-canvas"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false);
          setHoveredVehicle(null);
        }}
      />

      {/* Floating On-Screen Viewport Navigation Controls */}
      <div className="canvas-viewport-controls">
        <button className="btn-viewport-action" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn size={16} />
        </button>
        <button className="btn-viewport-action" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut size={16} />
        </button>
        <button className="btn-viewport-action" onClick={handleFitToScreen} title="Fit Entire 5x Map">
          <Maximize size={16} />
        </button>
        <button className="btn-viewport-action" onClick={handleReset100} title="Reset to 100% Zoom">
          <RotateCcw size={16} />
        </button>
        <span className="zoom-level-badge">{Math.round(zoom * 100)}%</span>
      </div>

      {/* Floating Minimap HUD in Corner */}
      <div className="canvas-minimap-card">
        <div className="minimap-header">5x World Radar</div>
        <canvas ref={minimapCanvasRef} width={180} height={135} className="minimap-canvas" />
      </div>

      {/* Vehicle Inspection Tooltip */}
      {hoveredVehicle && (
        <div
          className="vehicle-tooltip"
          style={{ left: hoveredVehicle.screenX + 12, top: hoveredVehicle.screenY - 40 }}
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
