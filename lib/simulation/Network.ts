// Bézier Road Network & 5x Multi-Corridor Lane Graph Builder

import { Vehicle } from './Vehicle';
import { LaneType, LaneDirection, StreetConfig, LaneDefinition } from '../types/street';
import { CubicBezier, evaluateBezierFull, approximateBezierLength } from './Curvature';

export { evaluateBezierFull, approximateBezierLength };
export type { CubicBezier };

export interface LaneSegment {
  id: string;
  name: string;
  type: LaneType;
  direction: LaneDirection;
  orientation: 'horizontal' | 'vertical' | 'turn';
  widthMeters: number;
  renderHeightPx: number;
  xOffsetPx?: number;      // Center x position for vertical lanes
  yOffsetPx: number;       // Center y position of this lane in pixels
  length: number;          // Longitudinal length in meters
  curve: CubicBezier;
  vehicles: Vehicle[];     // Current vehicles in lane
  nextLanes: string[];
  stopLine?: number;       // Stop-line position in meters (if present)
  speedLimitKmh: number;   // Base speed limit on this lane
}

export const PIXELS_PER_METER = 16;
export const DEFAULT_WORLD_WIDTH = 3200;
export const DEFAULT_WORLD_HEIGHT = 2400;
export const MARGIN_PORTAL = 40;

/**
 * Generate 5x Bézier road network from StreetConfig
 */
export function buildNetworkFromConfig(config: StreetConfig): {
  lanes: LaneSegment[];
  totalWidth: number;
  totalHeight: number;
} {
  const lanes: LaneSegment[] = [];
  const worldW = config.worldWidth || DEFAULT_WORLD_WIDTH;
  const worldH = config.worldHeight || DEFAULT_WORLD_HEIGHT;
  const centerX = worldW / 2;
  const centerY = worldH / 2;
  const curvature = config.curvatureIntensity ?? 0;

  // Separate horizontal (EW) and vertical (NS) lane definitions
  const horizontalLanes = config.lanes.filter((l) => l.orientation !== 'vertical');
  const verticalLanes = config.lanes.filter((l) => l.orientation === 'vertical');

  // If no vertical lanes are explicitly defined, generate matching vertical cross-street automatically
  const effectiveVerticalLanes: LaneDefinition[] =
    verticalLanes.length > 0
      ? verticalLanes
      : [
          { id: 'ns_walk_nb', name: 'West Walkway NB', type: 'sidewalk', width: 2.5, direction: 'reverse', orientation: 'vertical', speedLimitKmh: 5 },
          { id: 'ns_bike_nb', name: 'West Bike Lane NB', type: 'bike', width: 2.0, direction: 'reverse', orientation: 'vertical', speedLimitKmh: 20 },
          { id: 'ns_travel_sb', name: 'Avenue Travel SB', type: 'motor', width: 3.4, direction: 'forward', orientation: 'vertical', speedLimitKmh: 45, stopLineMeters: (centerY - 80) / PIXELS_PER_METER },
          { id: 'ns_travel_nb', name: 'Avenue Travel NB', type: 'motor', width: 3.4, direction: 'reverse', orientation: 'vertical', speedLimitKmh: 45, stopLineMeters: (centerY - 80) / PIXELS_PER_METER },
          { id: 'ns_bike_sb', name: 'East Bike Lane SB', type: 'bike', width: 2.0, direction: 'forward', orientation: 'vertical', speedLimitKmh: 20 },
          { id: 'ns_walk_sb', name: 'East Walkway SB', type: 'sidewalk', width: 2.5, direction: 'forward', orientation: 'vertical', speedLimitKmh: 5 },
        ];

  // 1. Build East-West Horizontal Corridor (West Gate <-> East Gate)
  const totalHHeight = horizontalLanes.reduce((acc, l) => acc + Math.max(24, Math.round(l.width * PIXELS_PER_METER)) + 2, 0);
  let currentY = centerY - totalHHeight / 2;

  const leftX = MARGIN_PORTAL;
  const rightX = worldW - MARGIN_PORTAL;
  const roadSpanX = rightX - leftX;

  for (const laneDef of horizontalLanes) {
    const heightPx = Math.max(24, Math.round(laneDef.width * PIXELS_PER_METER));
    const yCenter = currentY + heightPx / 2;
    currentY += heightPx + 2;

    const curveDeflection = curvature * 120;

    let p0 = { x: leftX, y: yCenter };
    let p1 = { x: leftX + roadSpanX / 3, y: yCenter + curveDeflection * 0.8 };
    let p2 = { x: leftX + (2 * roadSpanX) / 3, y: yCenter + curveDeflection * 0.8 };
    let p3 = { x: rightX, y: yCenter };

    if (laneDef.direction === 'reverse') {
      // Westbound: East Gate -> West Gate
      p0 = { x: rightX, y: yCenter };
      p1 = { x: rightX - roadSpanX / 3, y: yCenter + curveDeflection * 0.8 };
      p2 = { x: leftX + roadSpanX / 3, y: yCenter + curveDeflection * 0.8 };
      p3 = { x: leftX, y: yCenter };
    }

    const curve: CubicBezier = { p0, p1, p2, p3 };
    const lengthPx = approximateBezierLength(curve, 24);
    const lengthMeters = lengthPx / PIXELS_PER_METER;

    const stopLineDist = laneDef.stopLineMeters ?? (roadSpanX / 2 - 80) / PIXELS_PER_METER;

    lanes.push({
      id: laneDef.id,
      name: laneDef.name,
      type: laneDef.type,
      direction: laneDef.direction,
      orientation: 'horizontal',
      widthMeters: laneDef.width,
      renderHeightPx: heightPx,
      yOffsetPx: yCenter,
      length: lengthMeters,
      curve,
      vehicles: [],
      nextLanes: [],
      stopLine: laneDef.type === 'motor' || laneDef.type === 'transit' ? stopLineDist : undefined,
      speedLimitKmh: laneDef.speedLimitKmh || 50,
    });
  }

  // 2. Build North-South Vertical Corridor (North Gate <-> South Gate)
  const totalVWidth = effectiveVerticalLanes.reduce((acc, l) => acc + Math.max(24, Math.round(l.width * PIXELS_PER_METER)) + 2, 0);
  let currentX = centerX - totalVWidth / 2;

  const topY = MARGIN_PORTAL;
  const bottomY = worldH - MARGIN_PORTAL;
  const roadSpanY = bottomY - topY;

  for (const laneDef of effectiveVerticalLanes) {
    const widthPx = Math.max(24, Math.round(laneDef.width * PIXELS_PER_METER));
    const xCenter = currentX + widthPx / 2;
    currentX += widthPx + 2;

    let p0 = { x: xCenter, y: topY };
    let p1 = { x: xCenter, y: topY + roadSpanY / 3 };
    let p2 = { x: xCenter, y: topY + (2 * roadSpanY) / 3 };
    let p3 = { x: xCenter, y: bottomY };

    if (laneDef.direction === 'reverse') {
      // Northbound: South Gate -> North Gate
      p0 = { x: xCenter, y: bottomY };
      p1 = { x: xCenter, y: bottomY - roadSpanY / 3 };
      p2 = { x: xCenter, y: topY + roadSpanY / 3 };
      p3 = { x: xCenter, y: topY };
    }

    const curve: CubicBezier = { p0, p1, p2, p3 };
    const lengthPx = approximateBezierLength(curve, 24);
    const lengthMeters = lengthPx / PIXELS_PER_METER;

    const stopLineDist = laneDef.stopLineMeters ?? (roadSpanY / 2 - 80) / PIXELS_PER_METER;

    lanes.push({
      id: laneDef.id,
      name: laneDef.name,
      type: laneDef.type,
      direction: laneDef.direction,
      orientation: 'vertical',
      widthMeters: laneDef.width,
      renderHeightPx: widthPx,
      xOffsetPx: xCenter,
      yOffsetPx: centerY,
      length: lengthMeters,
      curve,
      vehicles: [],
      nextLanes: [],
      stopLine: laneDef.type === 'motor' || laneDef.type === 'transit' ? stopLineDist : undefined,
      speedLimitKmh: laneDef.speedLimitKmh || 45,
    });
  }

  return { lanes, totalWidth: worldW, totalHeight: worldH };
}
