// High-Fidelity Canvas Road Renderer with Turn Bays, Painted Turn Arrows & Phased Signals

import { LaneSegment, evaluateBezierFull } from '../simulation/Network';
import { TrafficSignal } from '../simulation/TrafficSignal';
import { IntersectionConfig } from '../types/street';

const LANE_ASPHALT_COLORS: Record<string, string> = {
  sidewalk: '#E2E8F0',     // Light concrete sidewalk
  bike: '#059669',         // Protected green bike lane
  motor: '#1E293B',        // Dark asphalt
  transit: '#7C2D12',      // Red transit priority pavement
  parking: '#334155',      // Parking shoulder asphalt
  turn_left: '#1E293B',
  turn_right: '#1E293B',
  center_turn: '#1E293B',
  median: '#166534',       // Green vegetative median
  shared: '#D97706',       // Amber cobblestone shared street
};

export function drawRoads(
  ctx: CanvasRenderingContext2D,
  lanes: LaneSegment[],
  signals: TrafficSignal[],
  intersections: IntersectionConfig[],
  worldWidth: number,
  worldHeight: number,
): void {
  // 1. Clear / Background Landscape (Terrain Grid)
  ctx.fillStyle = '#090D16';
  ctx.fillRect(0, 0, worldWidth, worldHeight);

  // Background terrain grid
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
  ctx.lineWidth = 1;
  const gridSize = 100;
  for (let x = 0; x <= worldWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, worldHeight);
    ctx.stroke();
  }
  for (let y = 0; y <= worldHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(worldWidth, y);
    ctx.stroke();
  }

  if (lanes.length === 0) return;

  const centerX = worldWidth / 2;
  const centerY = worldHeight / 2;

  // 2. Draw Lane Pavement Surfaces
  const throughLanes = lanes.filter((l) => l.orientation !== 'turn');
  const turningLanes = lanes.filter((l) => l.orientation === 'turn');

  for (const lane of throughLanes) {
    const halfH = lane.renderHeightPx / 2;
    ctx.fillStyle = LANE_ASPHALT_COLORS[lane.type] || '#1E293B';

    ctx.beginPath();
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const pt = evaluateBezierFull(lane.curve, t);
      const perpAngle = pt.angle + Math.PI / 2;
      const ox = pt.x + Math.cos(perpAngle) * halfH;
      const oy = pt.y + Math.sin(perpAngle) * halfH;
      if (i === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
    }
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

    // Sidewalk paver pattern
    if (lane.type === 'sidewalk') {
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1;
      const p0 = lane.curve.p0;
      const p3 = lane.curve.p3;
      if (lane.orientation === 'vertical') {
        const minY = Math.min(p0.y, p3.y);
        const maxY = Math.max(p0.y, p3.y);
        for (let y = minY; y < maxY; y += 22) {
          ctx.beginPath();
          ctx.moveTo((lane.xOffsetPx || centerX) - halfH, y);
          ctx.lineTo((lane.xOffsetPx || centerX) + halfH, y);
          ctx.stroke();
        }
      } else {
        const minX = Math.min(p0.x, p3.x);
        const maxX = Math.max(p0.x, p3.x);
        for (let x = minX; x < maxX; x += 22) {
          ctx.beginPath();
          ctx.moveTo(x, lane.yOffsetPx - halfH);
          ctx.lineTo(x, lane.yOffsetPx + halfH);
          ctx.stroke();
        }
      }
    }

    // Bike lane markers
    if (lane.type === 'bike') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      const p0 = lane.curve.p0;
      const p3 = lane.curve.p3;
      if (lane.orientation === 'vertical') {
        const minY = Math.min(p0.y, p3.y);
        const maxY = Math.max(p0.y, p3.y);
        for (let y = minY + 80; y < maxY; y += 240) {
          ctx.fillText('🚲', lane.xOffsetPx || centerX, y + 4);
        }
      } else {
        const minX = Math.min(p0.x, p3.x);
        const maxX = Math.max(p0.x, p3.x);
        for (let x = minX + 80; x < maxX; x += 240) {
          ctx.fillText('🚲', x, lane.yOffsetPx + 4);
        }
      }
    }
  }

  // 3. Central 4-Way Intersection Pavement Box
  ctx.fillStyle = '#1E293B';
  const coreHalfSize = 130;
  ctx.fillRect(centerX - coreHalfSize, centerY - coreHalfSize, coreHalfSize * 2, coreHalfSize * 2);

  // Draw Turning Guide Lines inside crossroads core
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 10]);
  for (const tLane of turningLanes) {
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const pt = evaluateBezierFull(tLane.curve, i / 20);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 4. Painted Pavement Turn Arrows & Through Arrows
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';

  // Eastbound Approach Arrows (x = 1380, before stop line)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.fillText('⮤', 1380, centerY - 38); // Left turn
  ctx.fillText('⮞', 1380, centerY - 12); // Through
  ctx.fillText('⮡', 1380, centerY + 12); // Right turn

  // Westbound Approach Arrows (x = 1820)
  ctx.fillText('⮧', 1820, centerY + 18); // Left turn
  ctx.fillText('⮜', 1820, centerY + 42); // Through
  ctx.fillText('⮠', 1820, centerY - 12); // Right turn

  // Southbound Approach Arrows (y = 980)
  ctx.fillText('⮡', centerX + 12, 980);  // Left turn
  ctx.fillText('⮟', centerX - 12, 980);  // Through
  ctx.fillText('⮤', centerX - 38, 980);  // Right turn

  // Northbound Approach Arrows (y = 1420)
  ctx.fillText('⮠', centerX - 12, 1420); // Left turn
  ctx.fillText('⮝', centerX + 12, 1420); // Through
  ctx.fillText('⮧', centerX + 38, 1420); // Right turn

  // 5. Draw Stop Bars & Crosswalks on All 4 Approaches
  const primaryIntersection = intersections[0];

  for (const lane of throughLanes) {
    if (lane.stopLine !== undefined) {
      const t = Math.max(0, Math.min(1, lane.stopLine / lane.length));
      const pt = evaluateBezierFull(lane.curve, t);
      const halfH = lane.renderHeightPx / 2;

      let lightColor: 'green' | 'yellow' | 'red' = 'green';
      for (const sig of signals) {
        lightColor = sig.getSignalStateForLane(lane.id);
        if (lightColor !== 'green') break;
      }

      if (lane.type === 'sidewalk') {
        ctx.strokeStyle = lightColor === 'green' ? '#22C55E' : '#EF4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (lane.orientation === 'vertical') {
          ctx.moveTo(pt.x - halfH, pt.y);
          ctx.lineTo(pt.x + halfH, pt.y);
        } else {
          ctx.moveTo(pt.x, pt.y - halfH);
          ctx.lineTo(pt.x, pt.y + halfH);
        }
        ctx.stroke();
      } else {
        const stopLineColor =
          primaryIntersection?.type === 'stop'
            ? '#EF4444'
            : lightColor === 'red'
            ? '#EF4444'
            : lightColor === 'yellow'
            ? '#FACC15'
            : '#22C55E';

        ctx.strokeStyle = stopLineColor;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        if (lane.orientation === 'vertical') {
          ctx.moveTo(pt.x - halfH, pt.y);
          ctx.lineTo(pt.x + halfH, pt.y);
        } else {
          ctx.moveTo(pt.x, pt.y - halfH);
          ctx.lineTo(pt.x, pt.y + halfH);
        }
        ctx.stroke();

        // Zebra stripes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        if (lane.orientation === 'vertical') {
          for (let cx = pt.x - halfH + 4; cx < pt.x + halfH - 4; cx += 8) {
            const offset = lane.direction === 'reverse' ? 2 : -10;
            ctx.fillRect(cx, pt.y + offset, 4, 8);
          }
        } else {
          for (let cy = pt.y - halfH + 4; cy < pt.y + halfH - 4; cy += 8) {
            const offset = lane.direction === 'reverse' ? -10 : 2;
            ctx.fillRect(pt.x + offset, cy, 8, 4);
          }
        }
      }
    }
  }

  // 6. Draw 4 Master Signal Mast Heads & Left Turn Arrow Heads
  if (primaryIntersection?.type === 'lights' && signals.length > 0) {
    const sig = signals[0];

    const ebThrough = sig.getSignalStateForLane('travel_eb_1');
    const ebLeft = sig.getSignalStateForLane('turn_left_eb');

    const wbThrough = sig.getSignalStateForLane('travel_wb_1');
    const wbLeft = sig.getSignalStateForLane('turn_left_wb');

    const sbThrough = sig.getSignalStateForLane('ns_travel_sb');
    const sbLeft = sig.getSignalStateForLane('turn_left_sb');

    const nbThrough = sig.getSignalStateForLane('ns_travel_nb');
    const nbLeft = sig.getSignalStateForLane('turn_left_nb');

    const ebPedState = sig.getSignalStateForLane('sidewalk_eb');
    const wbPedState = sig.getSignalStateForLane('sidewalk_wb');
    const sbPedState = sig.getSignalStateForLane('ns_walk_sb');
    const nbPedState = sig.getSignalStateForLane('ns_walk_nb');

    // West Approach Signal (facing EB)
    drawSignalHead(ctx, centerX - coreHalfSize - 14, centerY - 30, ebThrough, 'vertical');
    drawTurnArrowSignal(ctx, centerX - coreHalfSize - 14, centerY - 65, ebLeft === 'green');

    // East Approach Signal (facing WB)
    drawSignalHead(ctx, centerX + coreHalfSize + 14, centerY + 30, wbThrough, 'vertical');
    drawTurnArrowSignal(ctx, centerX + coreHalfSize + 14, centerY + 65, wbLeft === 'green');

    // North Approach Signal (facing SB)
    drawSignalHead(ctx, centerX - 30, centerY - coreHalfSize - 14, sbThrough, 'horizontal');
    drawTurnArrowSignal(ctx, centerX + 15, centerY - coreHalfSize - 14, sbLeft === 'green');

    // South Approach Signal (facing NB)
    drawSignalHead(ctx, centerX + 30, centerY + coreHalfSize + 14, nbThrough, 'horizontal');
    drawTurnArrowSignal(ctx, centerX - 15, centerY + coreHalfSize + 14, nbLeft === 'green');

    // Pedestrian Walk / Don't Walk Heads on the 4 Corner Curbs
    drawPedestrianSignal(ctx, centerX - coreHalfSize - 14, centerY - 110, ebPedState === 'green');
    drawPedestrianSignal(ctx, centerX + coreHalfSize + 14, centerY + 110, wbPedState === 'green');
    drawPedestrianSignal(ctx, centerX + 110, centerY - coreHalfSize - 14, sbPedState === 'green');
    drawPedestrianSignal(ctx, centerX - 110, centerY + coreHalfSize + 14, nbPedState === 'green');
  }

  // 7. Draw Glowing 4-Side Perimeter Ingress & Outgress Portals
  drawPortalBadge(ctx, 40, centerY, 'WEST PORTAL', 'Ingress (EB) · Outgress (WB)', '#3B82F6', 'left');
  drawPortalBadge(ctx, worldWidth - 40, centerY, 'EAST PORTAL', 'Ingress (WB) · Outgress (EB)', '#10B981', 'right');
  drawPortalBadge(ctx, centerX, 40, 'NORTH PORTAL', 'Ingress (SB) · Outgress (NB)', '#F59E0B', 'top');
  drawPortalBadge(ctx, centerX, worldHeight - 40, 'SOUTH PORTAL', 'Ingress (NB) · Outgress (SB)', '#8B5CF6', 'bottom');
}

function drawSignalHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: 'green' | 'yellow' | 'red',
  layout: 'vertical' | 'horizontal',
): void {
  ctx.save();
  ctx.fillStyle = '#0F172A';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;

  if (layout === 'vertical') {
    const w = 18;
    const h = 42;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);

    // Red
    ctx.beginPath();
    ctx.arc(x, y - 12, 4, 0, Math.PI * 2);
    ctx.fillStyle = color === 'red' ? '#EF4444' : '#450A0A';
    if (color === 'red') { ctx.shadowColor = '#EF4444'; ctx.shadowBlur = 8; }
    ctx.fill();
    ctx.shadowBlur = 0;

    // Yellow
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color === 'yellow' ? '#FACC15' : '#422006';
    if (color === 'yellow') { ctx.shadowColor = '#FACC15'; ctx.shadowBlur = 8; }
    ctx.fill();
    ctx.shadowBlur = 0;

    // Green
    ctx.beginPath();
    ctx.arc(x, y + 12, 4, 0, Math.PI * 2);
    ctx.fillStyle = color === 'green' ? '#22C55E' : '#052E16';
    if (color === 'green') { ctx.shadowColor = '#22C55E'; ctx.shadowBlur = 8; }
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    const w = 42;
    const h = 18;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);

    // Red
    ctx.beginPath();
    ctx.arc(x - 12, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color === 'red' ? '#EF4444' : '#450A0A';
    if (color === 'red') { ctx.shadowColor = '#EF4444'; ctx.shadowBlur = 8; }
    ctx.fill();
    ctx.shadowBlur = 0;

    // Yellow
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color === 'yellow' ? '#FACC15' : '#422006';
    if (color === 'yellow') { ctx.shadowColor = '#FACC15'; ctx.shadowBlur = 8; }
    ctx.fill();
    ctx.shadowBlur = 0;

    // Green
    ctx.beginPath();
    ctx.arc(x + 12, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color === 'green' ? '#22C55E' : '#052E16';
    if (color === 'green') { ctx.shadowColor = '#22C55E'; ctx.shadowBlur = 8; }
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function drawTurnArrowSignal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isGreenArrow: boolean,
): void {
  ctx.save();
  const size = 18;
  ctx.fillStyle = '#0F172A';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x - size / 2, y - size / 2, size, size);
  ctx.strokeRect(x - size / 2, y - size / 2, size, size);

  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (isGreenArrow) {
    ctx.fillStyle = '#22C55E';
    ctx.shadowColor = '#22C55E';
    ctx.shadowBlur = 6;
    ctx.fillText('⮤', x, y);
  } else {
    ctx.fillStyle = '#EF4444';
    ctx.fillText('⮤', x, y);
  }
  ctx.restore();
}

function drawPedestrianSignal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isWalk: boolean,
): void {
  ctx.save();
  const w = 22;
  const h = 22;
  ctx.fillStyle = '#0F172A';
  ctx.strokeStyle = isWalk ? '#22C55E' : '#EF4444';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.strokeRect(x - w / 2, y - h / 2, w, h);

  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (isWalk) {
    ctx.fillStyle = '#22C55E';
    ctx.shadowColor = '#22C55E';
    ctx.shadowBlur = 6;
    ctx.fillText('🚶', x, y + 1);
  } else {
    ctx.fillStyle = '#EF4444';
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 6;
    ctx.fillText('✋', x, y + 1);
  }
  ctx.restore();
}

function drawPortalBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  title: string,
  subtitle: string,
  accentColor: string,
  side: 'left' | 'right' | 'top' | 'bottom',
): void {
  ctx.save();
  const boxW = 210;
  const boxH = 46;

  let rx = x - boxW / 2;
  let ry = y - boxH / 2;

  if (side === 'left') rx = x + 10;
  if (side === 'right') rx = x - boxW - 10;
  if (side === 'top') ry = y + 10;
  if (side === 'bottom') ry = y - boxH - 10;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.roundRect(rx, ry, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, rx + 12, ry + 18);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '9px monospace';
  ctx.fillText(subtitle, rx + 12, ry + 34);

  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(rx + boxW - 16, ry + 18, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
