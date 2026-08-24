// High-Fidelity Canvas Road Renderer with Right-Hand Traffic, Median Islands & Pedestrian Refuges

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
  // 1. Background Landscape Grid
  ctx.fillStyle = '#090D16';
  ctx.fillRect(0, 0, worldWidth, worldHeight);

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
  const coreHalfSize = 130;

  // 2. Draw Lane Pavement Surfaces (Through corridors)
  const throughLanes = lanes.filter((l) => l.orientation !== 'turn');
  const turningLanes = lanes.filter((l) => l.orientation === 'turn' && l.type !== 'sidewalk');

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

    // Sidewalk paver grid pattern
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

    // Bike lane green stencil markers
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

  // 3. Central 4-Way Crossroads Asphalt Core
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(centerX - coreHalfSize, centerY - coreHalfSize, coreHalfSize * 2, coreHalfSize * 2);

  // 4. Center Medians & Concrete Pedestrian Refuge Islands (Right-Hand Traffic divider)
  ctx.fillStyle = '#166534'; // Vegetative grass green
  ctx.strokeStyle = '#94A3B8'; // Concrete curb border
  ctx.lineWidth = 1.5;

  // West Median (from left boundary to stop line)
  ctx.fillRect(40, centerY - 4, centerX - coreHalfSize - 40 - 15, 8);
  ctx.strokeRect(40, centerY - 4, centerX - coreHalfSize - 40 - 15, 8);

  // East Median
  ctx.fillRect(centerX + coreHalfSize + 15, centerY - 4, worldWidth - 40 - (centerX + coreHalfSize + 15), 8);
  ctx.strokeRect(centerX + coreHalfSize + 15, centerY - 4, worldWidth - 40 - (centerX + coreHalfSize + 15), 8);

  // North Median
  ctx.fillRect(centerX - 4, 40, 8, centerY - coreHalfSize - 40 - 15);
  ctx.strokeRect(centerX - 4, 40, 8, centerY - coreHalfSize - 40 - 15);

  // South Median
  ctx.fillRect(centerX - 4, centerY + coreHalfSize + 15, 8, worldHeight - 40 - (centerY + coreHalfSize + 15));
  ctx.strokeRect(centerX - 4, centerY + coreHalfSize + 15, 8, worldHeight - 40 - (centerY + coreHalfSize + 15));

  // Pedestrian Refuge Island Cut-Throughs (Safe concrete refuge in middle of crosswalks)
  ctx.fillStyle = '#E2E8F0';
  ctx.strokeStyle = '#FACC15'; // Yellow tactile warning strips
  ctx.lineWidth = 1.5;

  // West Refuge Island
  ctx.fillRect(centerX - coreHalfSize - 15, centerY - 6, 12, 12);
  ctx.strokeRect(centerX - coreHalfSize - 15, centerY - 6, 12, 12);

  // East Refuge Island
  ctx.fillRect(centerX + coreHalfSize + 3, centerY - 6, 12, 12);
  ctx.strokeRect(centerX + coreHalfSize + 3, centerY - 6, 12, 12);

  // North Refuge Island
  ctx.fillRect(centerX - 6, centerY - coreHalfSize - 15, 12, 12);
  ctx.strokeRect(centerX - 6, centerY - coreHalfSize - 15, 12, 12);

  // South Refuge Island
  ctx.fillRect(centerX - 6, centerY + coreHalfSize + 3, 12, 12);
  ctx.strokeRect(centerX - 6, centerY + coreHalfSize + 3, 12, 12);

  // 5. Protected Intersection Corner Curb Islands (Bulb-Outs separating turn bays from crosswalks)
  ctx.fillStyle = '#CBD5E1';
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 1.5;

  // Northwest Corner Island
  ctx.beginPath();
  ctx.arc(centerX - coreHalfSize, centerY - coreHalfSize, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Northeast Corner Island
  ctx.beginPath();
  ctx.arc(centerX + coreHalfSize, centerY - coreHalfSize, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Southwest Corner Island
  ctx.beginPath();
  ctx.arc(centerX - coreHalfSize, centerY + coreHalfSize, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Southeast Corner Island
  ctx.beginPath();
  ctx.arc(centerX + coreHalfSize, centerY + coreHalfSize, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 6. Turning Guide Lines inside crossroads core
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

  // 7. Right-Hand Traffic Pavement Arrows
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';

  // Westbound Approach Arrows (North half, x = 1820)
  ctx.fillText('⮠', 1820, centerY - 46); // Right turn
  ctx.fillText('⮜', 1820, centerY - 24); // Through
  ctx.fillText('⮧', 1820, centerY - 6);  // Left turn

  // Eastbound Approach Arrows (South half, x = 1380)
  ctx.fillText('⮤', 1380, centerY + 6);  // Left turn
  ctx.fillText('⮞', 1380, centerY + 24); // Through
  ctx.fillText('⮡', 1380, centerY + 46); // Right turn

  // Southbound Approach Arrows (West half, y = 980)
  ctx.fillText('⮤', centerX - 46, 980); // Right turn
  ctx.fillText('⮟', centerX - 24, 980); // Through
  ctx.fillText('⮡', centerX - 6, 980);  // Left turn

  // Northbound Approach Arrows (East half, y = 1420)
  ctx.fillText('⮠', centerX + 6, 1420);  // Left turn
  ctx.fillText('⮝', centerX + 24, 1420); // Through
  ctx.fillText('⮧', centerX + 46, 1420); // Right turn

  // 8. Draw Stop Bars & High-Visibility Zebra Crosswalks
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
        // Curb ramp line
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

        // Zebra crosswalk stripes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        if (lane.orientation === 'vertical') {
          for (let cx = pt.x - halfH + 3; cx < pt.x + halfH - 3; cx += 8) {
            const offset = lane.direction === 'reverse' ? 2 : -10;
            ctx.fillRect(cx, pt.y + offset, 4, 8);
          }
        } else {
          for (let cy = pt.y - halfH + 3; cy < pt.y + halfH - 3; cy += 8) {
            const offset = lane.direction === 'reverse' ? -10 : 2;
            ctx.fillRect(pt.x + offset, cy, 8, 4);
          }
        }
      }
    }
  }

  // 9. Draw 4 Master Signal Mast Heads & Left Turn Arrow Heads
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

    // West Approach Signal (facing EB, on South side)
    drawSignalHead(ctx, centerX - coreHalfSize - 14, centerY + 30, ebThrough, 'vertical');
    drawTurnArrowSignal(ctx, centerX - coreHalfSize - 14, centerY + 6, ebLeft === 'green');

    // East Approach Signal (facing WB, on North side)
    drawSignalHead(ctx, centerX + coreHalfSize + 14, centerY - 30, wbThrough, 'vertical');
    drawTurnArrowSignal(ctx, centerX + coreHalfSize + 14, centerY - 6, wbLeft === 'green');

    // North Approach Signal (facing SB, on West side)
    drawSignalHead(ctx, centerX - 30, centerY - coreHalfSize - 14, sbThrough, 'horizontal');
    drawTurnArrowSignal(ctx, centerX - 6, centerY - coreHalfSize - 14, sbLeft === 'green');

    // South Approach Signal (facing NB, on East side)
    drawSignalHead(ctx, centerX + 30, centerY + coreHalfSize + 14, nbThrough, 'horizontal');
    drawTurnArrowSignal(ctx, centerX + 6, centerY + coreHalfSize + 14, nbLeft === 'green');

    // Pedestrian Walk / Don't Walk Heads on the 4 Corner Curbs
    drawPedestrianSignal(ctx, centerX - coreHalfSize - 14, centerY - 95, wbPedState === 'green');
    drawPedestrianSignal(ctx, centerX + coreHalfSize + 14, centerY + 95, ebPedState === 'green');
    drawPedestrianSignal(ctx, centerX + 95, centerY - coreHalfSize - 14, nbPedState === 'green');
    drawPedestrianSignal(ctx, centerX - 95, centerY + coreHalfSize + 14, sbPedState === 'green');
  }

  // 10. Glowing 4-Side Perimeter Ingress & Outgress Portals
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
