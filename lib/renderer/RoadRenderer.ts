// High-Fidelity Canvas Road Renderer with Markings, Signals, and Cross-Sections

import { LaneSegment, evaluateBezierFull, PIXELS_PER_METER } from '../simulation/Network';
import { TrafficSignal } from '../simulation/TrafficSignal';
import { IntersectionConfig } from '../types/street';

const LANE_ASPHALT_COLORS: Record<string, string> = {
  sidewalk: '#E2E8F0',     // Light concrete sidewalk
  bike: '#059669',         // Protected green bike lane
  motor: '#1E293B',        // Dark asphalt
  transit: '#7C2D12',      // Red transit / BRT priority pavement
  parking: '#334155',      // Parking shoulder asphalt
  turn_left: '#1E293B',
  turn_right: '#1E293B',
  center_turn: '#1E293B',
  median: '#166534',       // Green vegetative / grass median
  shared: '#D97706',       // Amber cobblestone shared street
};

export function drawRoads(
  ctx: CanvasRenderingContext2D,
  lanes: LaneSegment[],
  signals: TrafficSignal[],
  intersections: IntersectionConfig[],
  canvasWidth: number,
  canvasHeight: number,
): void {
  // Clear / Background Landscape
  ctx.fillStyle = '#0F172A'; // Deep midnight slate
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  if (lanes.length === 0) return;

  // 1. Draw Lane Pavement Surfaces
  for (const lane of lanes) {
    const halfH = lane.renderHeightPx / 2;
    const p0 = lane.curve.p0;
    const p3 = lane.curve.p3;
    const minX = Math.min(p0.x, p3.x);
    const maxX = Math.max(p0.x, p3.x);
    const width = maxX - minX;

    // Base pavement fill
    ctx.fillStyle = LANE_ASPHALT_COLORS[lane.type] || '#1E293B';

    // Draw along Bézier ribbon or bounding strip
    ctx.beginPath();
    const steps = 30;
    // Top boundary
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const pt = evaluateBezierFull(lane.curve, t);
      // Offset perpendicular to angle
      const perpAngle = pt.angle + Math.PI / 2;
      const ox = pt.x + Math.cos(perpAngle) * halfH;
      const oy = pt.y + Math.sin(perpAngle) * halfH;
      if (i === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
    }
    // Bottom boundary in reverse
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const pt = evaluateBezierFull(lane.curve, t);
      const perpAngle = pt.angle - Math.PI / 2;
      const ox = pt.x + Math.cos(perpAngle) * halfH;
      const oy = pt.y + Math.sin(perpAngle) * halfH;
      ctx.lineTo(ox, oy);
    }
    ctx.closePath();
    ctx.fill();

    // Sidewalk paver grid pattern
    if (lane.type === 'sidewalk') {
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1;
      for (let x = minX; x < maxX; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, lane.yOffsetPx - halfH);
        ctx.lineTo(x, lane.yOffsetPx + halfH);
        ctx.stroke();
      }
    }

    // Bike lane green stencil markers
    if (lane.type === 'bike') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      for (let x = minX + 60; x < maxX; x += 150) {
        ctx.fillText('🚲', x, lane.yOffsetPx + 4);
      }
    }

    // Transit BRT text markings
    if (lane.type === 'transit') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      for (let x = minX + 100; x < maxX; x += 220) {
        ctx.fillText('BUS ONLY', x, lane.yOffsetPx + 4);
      }
    }
  }

  // 2. Draw Dividers, Striping, and Markings
  for (let idx = 0; idx < lanes.length; idx++) {
    const lane = lanes[idx];
    const halfH = lane.renderHeightPx / 2;
    const nextLane = lanes[idx + 1];

    if (nextLane) {
      const isOpposing = lane.direction !== nextLane.direction;
      const boundaryY = (lane.yOffsetPx + halfH + nextLane.yOffsetPx - nextLane.renderHeightPx / 2) / 2;

      ctx.beginPath();
      const steps = 30;

      if (isOpposing) {
        // Double Yellow Line for Two-Way Road divider
        ctx.strokeStyle = '#FACC15'; // Bright Amber
        ctx.lineWidth = 2;
        ctx.setLineDash([]);

        // Line 1
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const pt = evaluateBezierFull(lane.curve, i / steps);
          const ox = pt.x;
          const oy = pt.y + halfH - 1.5;
          if (i === 0) ctx.moveTo(ox, oy);
          else ctx.lineTo(ox, oy);
        }
        ctx.stroke();

        // Line 2
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const pt = evaluateBezierFull(lane.curve, i / steps);
          const ox = pt.x;
          const oy = pt.y + halfH + 1.5;
          if (i === 0) ctx.moveTo(ox, oy);
          else ctx.lineTo(ox, oy);
        }
        ctx.stroke();
      } else {
        // White dashed line for same-direction lanes
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([16, 12]);

        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const pt = evaluateBezierFull(lane.curve, i / steps);
          const ox = pt.x;
          const oy = pt.y + halfH;
          if (i === 0) ctx.moveTo(ox, oy);
          else ctx.lineTo(ox, oy);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Direction arrows along center of lane
    if (lane.type === 'motor' || lane.type === 'transit' || lane.type === 'shared') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      const arrowChar = lane.direction === 'reverse' ? '⮜' : '⮞';
      const p0 = lane.curve.p0;
      const p3 = lane.curve.p3;
      const minX = Math.min(p0.x, p3.x);
      const maxX = Math.max(p0.x, p3.x);
      for (let x = minX + 120; x < maxX - 80; x += 180) {
        ctx.fillText(arrowChar, x, lane.yOffsetPx + 5);
      }
    }
  }

  // 3. Draw Intersections, Stop Lines, Stop Signs, and Traffic Signals
  const primaryIntersection = intersections[0];

  for (const lane of lanes) {
    if (lane.stopLine !== undefined) {
      const t = Math.max(0, Math.min(1, lane.stopLine / lane.length));
      const pt = evaluateBezierFull(lane.curve, t);
      const halfH = lane.renderHeightPx / 2;

      // Determine signal state
      let lightColor: 'green' | 'yellow' | 'red' = 'green';
      for (const sig of signals) {
        lightColor = sig.getSignalStateForLane(lane.id);
        if (lightColor !== 'green') break;
      }

      // Draw Stop Line
      const stopLineColor =
        primaryIntersection?.type === 'stop'
          ? '#EF4444'
          : lightColor === 'red'
          ? '#EF4444'
          : lightColor === 'yellow'
          ? '#FACC15'
          : '#22C55E';

      ctx.strokeStyle = stopLineColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y - halfH);
      ctx.lineTo(pt.x, pt.y + halfH);
      ctx.stroke();

      // Zebra Crosswalk stripes near stop line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let cy = pt.y - halfH + 4; cy < pt.y + halfH - 4; cy += 8) {
        const offset = lane.direction === 'reverse' ? -10 : 2;
        ctx.fillRect(pt.x + offset, cy, 8, 4);
      }

      // If Traffic Signal, draw compact 3-light indicator box
      if (primaryIntersection?.type === 'lights') {
        const boxX = pt.x + (lane.direction === 'reverse' ? -22 : 6);
        const boxY = pt.y - 12;

        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.fillRect(boxX, boxY, 16, 24);
        ctx.strokeRect(boxX, boxY, 16, 24);

        // Red light
        ctx.beginPath();
        ctx.arc(boxX + 8, boxY + 5, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = lightColor === 'red' ? '#EF4444' : '#450A0A';
        ctx.fill();

        // Yellow light
        ctx.beginPath();
        ctx.arc(boxX + 8, boxY + 12, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = lightColor === 'yellow' ? '#FACC15' : '#422006';
        ctx.fill();

        // Green light
        ctx.beginPath();
        ctx.arc(boxX + 8, boxY + 19, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = lightColor === 'green' ? '#22C55E' : '#052E16';
        ctx.fill();
      }

      // If Stop Sign, draw red octagon
      if (primaryIntersection?.type === 'stop') {
        const octX = pt.x + (lane.direction === 'reverse' ? -18 : 10);
        const octY = pt.y;
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.arc(octX, octY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('STOP', octX, octY + 2.5);
      }
    }
  }

  // 4. Lane Info Labels (Left Edge)
  for (const lane of lanes) {
    const p0 = lane.curve.p0;
    const p3 = lane.curve.p3;
    const minX = Math.min(p0.x, p3.x);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(minX + 4, lane.yOffsetPx - 9, 130, 18);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.strokeRect(minX + 4, lane.yOffsetPx - 9, 130, 18);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${lane.name.slice(0, 14)} (${lane.widthMeters}m)`, minX + 8, lane.yOffsetPx + 3);
  }
}
