// High-Fidelity Canvas Road Renderer for Multi-Lane Urban Corridors with Dedicated Turn Bays

import { LaneSegment, evaluateLanePosition } from '../simulation/Network';
import { TrafficSignal } from '../simulation/TrafficSignal';
import { IntersectionConfig } from '../types/street';

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

  ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
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
  const coreHalfSize = 100; // 100px radius of crossroads junction box

  const leftX = 40;
  const rightX = worldWidth - 40;
  const topY = 40;
  const bottomY = worldHeight - 40;

  // 2. Draw Full Continuous Asphalt Base for East-West and North-South Boulevards
  // East-West Asphalt Roadbed (y: centerY - 95 to centerY + 95)
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(leftX, centerY - 95, rightX - leftX, 190);

  // North-South Asphalt Roadbed (x: centerX - 95 to centerX + 95)
  ctx.fillRect(centerX - 95, topY, 190, bottomY - topY);

  // 3. Draw Sidewalks (Light concrete ribbons on outer perimeter)
  ctx.fillStyle = '#E2E8F0';
  // North Sidewalk (EW)
  ctx.fillRect(leftX, centerY - 95, rightX - leftX, 22);
  // South Sidewalk (EW)
  ctx.fillRect(leftX, centerY + 73, rightX - leftX, 22);
  // West Sidewalk (NS)
  ctx.fillRect(centerX - 95, topY, 22, bottomY - topY);
  // East Sidewalk (NS)
  ctx.fillRect(centerX + 73, topY, 22, bottomY - topY);

  // Sidewalk scoring pavers
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  for (let x = leftX; x < rightX; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, centerY - 95); ctx.lineTo(x, centerY - 73);
    ctx.moveTo(x, centerY + 73); ctx.lineTo(x, centerY + 95);
    ctx.stroke();
  }
  for (let y = topY; y < bottomY; y += 22) {
    ctx.beginPath();
    ctx.moveTo(centerX - 95, y); ctx.lineTo(centerX - 73, y);
    ctx.moveTo(centerX + 73, y); ctx.lineTo(centerX + 95, y);
    ctx.stroke();
  }

  // 4. Draw Protected Green Bike Lanes
  ctx.fillStyle = '#059669';
  // WB Bike Lane (North side)
  ctx.fillRect(leftX, centerY - 73, rightX - leftX, 18);
  // EB Bike Lane (South side)
  ctx.fillRect(leftX, centerY + 55, rightX - leftX, 18);
  // SB Bike Lane (West side)
  ctx.fillRect(centerX - 73, topY, 18, bottomY - topY);
  // NB Bike Lane (East side)
  ctx.fillRect(centerX + 55, topY, 18, bottomY - topY);

  // Bike lane stencil icons
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  for (let x = leftX + 120; x < rightX - 120; x += 240) {
    ctx.fillText('🚲', x, centerY - 60);
    ctx.fillText('🚲', x, centerY + 68);
  }
  for (let y = topY + 120; y < bottomY - 120; y += 240) {
    ctx.fillText('🚲', centerX - 64, y + 4);
    ctx.fillText('🚲', centerX + 64, y + 4);
  }

  // 5. Draw White Dashed Lane Dividers for Motor Lanes & Turn Pocket Bays
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 12]);

  // EW Corridor Lane Dividers (West Approach)
  // Between Right Turn and Through (y = centerY - 34 and y = centerY + 34)
  ctx.beginPath();
  ctx.moveTo(leftX, centerY - 34); ctx.lineTo(centerX - coreHalfSize, centerY - 34);
  ctx.moveTo(leftX, centerY + 34); ctx.lineTo(centerX - coreHalfSize, centerY + 34);
  // Between Through and Left Turn (y = centerY - 16 and y = centerY + 16)
  ctx.moveTo(leftX, centerY - 16); ctx.lineTo(centerX - coreHalfSize, centerY - 16);
  ctx.moveTo(leftX, centerY + 16); ctx.lineTo(centerX - coreHalfSize, centerY + 16);
  ctx.stroke();

  // EW Corridor Lane Dividers (East Approach)
  ctx.beginPath();
  ctx.moveTo(centerX + coreHalfSize, centerY - 34); ctx.lineTo(rightX, centerY - 34);
  ctx.moveTo(centerX + coreHalfSize, centerY + 34); ctx.lineTo(rightX, centerY + 34);
  ctx.moveTo(centerX + coreHalfSize, centerY - 16); ctx.lineTo(rightX, centerY - 16);
  ctx.moveTo(centerX + coreHalfSize, centerY + 16); ctx.lineTo(rightX, centerY + 16);
  ctx.stroke();

  // NS Corridor Lane Dividers (North Approach)
  ctx.beginPath();
  ctx.moveTo(centerX - 34, topY); ctx.lineTo(centerX - 34, centerY - coreHalfSize);
  ctx.moveTo(centerX + 34, topY); ctx.lineTo(centerX + 34, centerY - coreHalfSize);
  ctx.moveTo(centerX - 16, topY); ctx.lineTo(centerX - 16, centerY - coreHalfSize);
  ctx.moveTo(centerX + 16, topY); ctx.lineTo(centerX + 16, centerY - coreHalfSize);
  ctx.stroke();

  // NS Corridor Lane Dividers (South Approach)
  ctx.beginPath();
  ctx.moveTo(centerX - 34, centerY + coreHalfSize); ctx.lineTo(centerX - 34, bottomY);
  ctx.moveTo(centerX + 34, centerY + coreHalfSize); ctx.lineTo(centerX + 34, bottomY);
  ctx.moveTo(centerX - 16, centerY + coreHalfSize); ctx.lineTo(centerX - 16, bottomY);
  ctx.moveTo(centerX + 16, centerY + coreHalfSize); ctx.lineTo(centerX + 16, bottomY);
  ctx.stroke();

  ctx.setLineDash([]);

  // 6. Central 4-Way Crossroads Junction Box
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(centerX - coreHalfSize, centerY - coreHalfSize, coreHalfSize * 2, coreHalfSize * 2);

  // 7. Center Medians & Concrete Pedestrian Refuge Islands (Dividing opposing traffic directions)
  ctx.fillStyle = '#166534'; // Vegetative grass green
  ctx.strokeStyle = '#FACC15'; // Yellow curb border
  ctx.lineWidth = 1.5;

  // West Median (y = centerY ± 3)
  ctx.fillRect(leftX, centerY - 3, centerX - coreHalfSize - leftX - 12, 6);
  ctx.strokeRect(leftX, centerY - 3, centerX - coreHalfSize - leftX - 12, 6);

  // East Median
  ctx.fillRect(centerX + coreHalfSize + 12, centerY - 3, rightX - (centerX + coreHalfSize + 12), 6);
  ctx.strokeRect(centerX + coreHalfSize + 12, centerY - 3, rightX - (centerX + coreHalfSize + 12), 6);

  // North Median (x = centerX ± 3)
  ctx.fillRect(centerX - 3, topY, 6, centerY - coreHalfSize - topY - 12);
  ctx.strokeRect(centerX - 3, topY, 6, centerY - coreHalfSize - topY - 12);

  // South Median
  ctx.fillRect(centerX - 3, centerY + coreHalfSize + 12, 6, bottomY - (centerY + coreHalfSize + 12));
  ctx.strokeRect(centerX - 3, centerY + coreHalfSize + 12, 6, bottomY - (centerY + coreHalfSize + 12));

  // Concrete Pedestrian Refuge Island Cut-Throughs at Crosswalks
  ctx.fillStyle = '#E2E8F0';
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 1.5;

  ctx.fillRect(centerX - coreHalfSize - 12, centerY - 5, 10, 10);
  ctx.strokeRect(centerX - coreHalfSize - 12, centerY - 5, 10, 10);

  ctx.fillRect(centerX + coreHalfSize + 2, centerY - 5, 10, 10);
  ctx.strokeRect(centerX + coreHalfSize + 2, centerY - 5, 10, 10);

  ctx.fillRect(centerX - 5, centerY - coreHalfSize - 12, 10, 10);
  ctx.strokeRect(centerX - 5, centerY - coreHalfSize - 12, 10, 10);

  ctx.fillRect(centerX - 5, centerY + coreHalfSize + 2, 10, 10);
  ctx.strokeRect(centerX - 5, centerY + coreHalfSize + 2, 10, 10);

  // Corner Curb Bulb-Out Islands
  ctx.fillStyle = '#CBD5E1';
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.arc(centerX - coreHalfSize, centerY - coreHalfSize, 12, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX + coreHalfSize, centerY - coreHalfSize, 12, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX - coreHalfSize, centerY + coreHalfSize, 12, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX + coreHalfSize, centerY + coreHalfSize, 12, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // 8. Painted Pavement Turn Stencils (Clear White Arrows inside each dedicated lane)
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';

  // Eastbound Approach Lanes (South half, x = centerX - coreHalfSize - 50)
  ctx.fillText('⮤', centerX - coreHalfSize - 50, centerY + 8);  // Left turn bay
  ctx.fillText('⮞', centerX - coreHalfSize - 50, centerY + 24); // Through lane
  ctx.fillText('⮡', centerX - coreHalfSize - 50, centerY + 44); // Right turn bay

  // Westbound Approach Lanes (North half, x = centerX + coreHalfSize + 50)
  ctx.fillText('⮠', centerX + coreHalfSize + 50, centerY - 44); // Right turn bay
  ctx.fillText('⮜', centerX + coreHalfSize + 50, centerY - 24); // Through lane
  ctx.fillText('⮧', centerX + coreHalfSize + 50, centerY - 8);  // Left turn bay

  // Southbound Approach Lanes (West half, y = centerY - coreHalfSize - 50)
  ctx.fillText('⮤', centerX - 44, centerY - coreHalfSize - 50); // Right turn bay
  ctx.fillText('⮟', centerX - 24, centerY - coreHalfSize - 50); // Through lane
  ctx.fillText('⮡', centerX - 8, centerY - coreHalfSize - 50);  // Left turn bay

  // Northbound Approach Lanes (East half, y = centerY + coreHalfSize + 50)
  ctx.fillText('⮠', centerX + 8, centerY + coreHalfSize + 50);  // Left turn bay
  ctx.fillText('⮝', centerX + 24, centerY + coreHalfSize + 50); // Through lane
  ctx.fillText('⮧', centerX + 44, centerY + coreHalfSize + 50); // Right turn bay

  // 9. Stop Bars & High-Visibility Zebra Crosswalks across all 4 road mouths
  const primaryIntersection = intersections[0];

  // Draw 4 Zebra Crosswalks (West, East, North, South)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';

  // West Crosswalk (x = centerX - coreHalfSize - 8)
  for (let y = centerY - 72; y <= centerY + 72; y += 8) {
    ctx.fillRect(centerX - coreHalfSize - 10, y, 8, 4);
  }
  // East Crosswalk (x = centerX + coreHalfSize + 2)
  for (let y = centerY - 72; y <= centerY + 72; y += 8) {
    ctx.fillRect(centerX + coreHalfSize + 2, y, 8, 4);
  }
  // North Crosswalk (y = centerY - coreHalfSize - 10)
  for (let x = centerX - 72; x <= centerX + 72; x += 8) {
    ctx.fillRect(x, centerY - coreHalfSize - 10, 4, 8);
  }
  // South Crosswalk (y = centerY + coreHalfSize + 2)
  for (let x = centerX - 72; x <= centerX + 72; x += 8) {
    ctx.fillRect(x, centerY + coreHalfSize + 2, 4, 8);
  }

  // Draw Stop Lines at intersection approach
  const drawStopBar = (x1: number, y1: number, x2: number, y2: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const sig = signals[0];
  const ebThrough = sig?.getSignalStateForLane('travel_eb_1') || 'green';
  const wbThrough = sig?.getSignalStateForLane('travel_wb_1') || 'green';
  const sbThrough = sig?.getSignalStateForLane('ns_travel_sb') || 'green';
  const nbThrough = sig?.getSignalStateForLane('ns_travel_nb') || 'green';

  const stopColor = (c: string) => (c === 'red' ? '#EF4444' : c === 'yellow' ? '#FACC15' : '#22C55E');

  // EB Stop Bar (South half)
  drawStopBar(centerX - coreHalfSize, centerY + 2, centerX - coreHalfSize, centerY + 54, stopColor(ebThrough));
  // WB Stop Bar (North half)
  drawStopBar(centerX + coreHalfSize, centerY - 54, centerX + coreHalfSize, centerY - 2, stopColor(wbThrough));
  // SB Stop Bar (West half)
  drawStopBar(centerX - 54, centerY - coreHalfSize, centerX - 2, centerY - coreHalfSize, stopColor(sbThrough));
  // NB Stop Bar (East half)
  drawStopBar(centerX + 2, centerY + coreHalfSize, centerX + 54, centerY + coreHalfSize, stopColor(nbThrough));

  // 10. Traffic Signal Heads (Round Mast Heads + Left Turn Arrows)
  if (primaryIntersection?.type === 'lights' && signals.length > 0) {
    const ebLeft = sig.getSignalStateForLane('turn_left_eb');
    const wbLeft = sig.getSignalStateForLane('turn_left_wb');
    const sbLeft = sig.getSignalStateForLane('turn_left_sb');
    const nbLeft = sig.getSignalStateForLane('turn_left_nb');

    const ebPedState = sig.getSignalStateForLane('sidewalk_eb');
    const wbPedState = sig.getSignalStateForLane('sidewalk_wb');
    const sbPedState = sig.getSignalStateForLane('ns_walk_sb');
    const nbPedState = sig.getSignalStateForLane('ns_walk_nb');

    // West Approach Signal (facing EB, on South side)
    drawSignalHead(ctx, centerX - coreHalfSize - 14, centerY + 30, ebThrough, 'vertical');
    drawTurnArrowSignal(ctx, centerX - coreHalfSize - 14, centerY + 8, ebLeft === 'green');

    // East Approach Signal (facing WB, on North side)
    drawSignalHead(ctx, centerX + coreHalfSize + 14, centerY - 30, wbThrough, 'vertical');
    drawTurnArrowSignal(ctx, centerX + coreHalfSize + 14, centerY - 8, wbLeft === 'green');

    // North Approach Signal (facing SB, on West side)
    drawSignalHead(ctx, centerX - 30, centerY - coreHalfSize - 14, sbThrough, 'horizontal');
    drawTurnArrowSignal(ctx, centerX - 8, centerY - coreHalfSize - 14, sbLeft === 'green');

    // South Approach Signal (facing NB, on East side)
    drawSignalHead(ctx, centerX + 30, centerY + coreHalfSize + 14, nbThrough, 'horizontal');
    drawTurnArrowSignal(ctx, centerX + 8, centerY + coreHalfSize + 14, nbLeft === 'green');

    // Pedestrian Walk / Don't Walk Heads on the 4 Corner Curbs
    drawPedestrianSignal(ctx, centerX - coreHalfSize - 14, centerY - 84, wbPedState === 'green');
    drawPedestrianSignal(ctx, centerX + coreHalfSize + 14, centerY + 84, ebPedState === 'green');
    drawPedestrianSignal(ctx, centerX + 84, centerY - coreHalfSize - 14, nbPedState === 'green');
    drawPedestrianSignal(ctx, centerX - 84, centerY + coreHalfSize + 14, sbPedState === 'green');
  }

  // 11. Glowing 4-Side Perimeter Ingress & Outgress Portals
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
