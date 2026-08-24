// Bézier Road Network & 5x Multi-Corridor Lane Graph Builder with Turning Lanes

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
export const INTERSECTION_CORE_SIZE = 130; // px half-size of central crossroads

/**
 * Generate 5x Bézier road network with through and turning lanes
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
  const horizontalLanes = config.lanes.filter((l) => l.orientation !== 'vertical' && l.orientation !== 'turn');
  const verticalLanes = config.lanes.filter((l) => l.orientation === 'vertical');

  const effectiveVerticalLanes: LaneDefinition[] =
    verticalLanes.length > 0
      ? verticalLanes
      : [
          { id: 'ns_walk_nb', name: 'West Avenue Sidewalk NB', type: 'sidewalk', width: 2.6, direction: 'reverse', orientation: 'vertical', speedLimitKmh: 5 },
          { id: 'ns_bike_nb', name: 'West Avenue Bike NB', type: 'bike', width: 2.0, direction: 'reverse', orientation: 'vertical', speedLimitKmh: 20 },
          { id: 'ns_travel_sb', name: 'Avenue Motor SB', type: 'motor', width: 3.4, direction: 'forward', orientation: 'vertical', speedLimitKmh: 45 },
          { id: 'ns_travel_nb', name: 'Avenue Motor NB', type: 'motor', width: 3.4, direction: 'reverse', orientation: 'vertical', speedLimitKmh: 45 },
          { id: 'ns_bike_sb', name: 'East Avenue Bike SB', type: 'bike', width: 2.0, direction: 'forward', orientation: 'vertical', speedLimitKmh: 20 },
          { id: 'ns_walk_sb', name: 'East Avenue Sidewalk SB', type: 'sidewalk', width: 2.6, direction: 'forward', orientation: 'vertical', speedLimitKmh: 5 },
        ];

  // 1. Build East-West Horizontal Corridor (West Gate <-> East Gate)
  const totalHHeight = horizontalLanes.reduce((acc, l) => acc + Math.max(24, Math.round(l.width * PIXELS_PER_METER)) + 2, 0);
  let currentY = centerY - totalHHeight / 2;

  const leftX = MARGIN_PORTAL;
  const rightX = worldW - MARGIN_PORTAL;
  const roadSpanX = rightX - leftX;

  let yMotorEB = centerY - 25;
  let yMotorWB = centerY + 25;

  for (const laneDef of horizontalLanes) {
    const heightPx = Math.max(24, Math.round(laneDef.width * PIXELS_PER_METER));
    const yCenter = currentY + heightPx / 2;
    currentY += heightPx + 2;

    if (laneDef.type === 'motor' && laneDef.direction === 'forward') yMotorEB = yCenter;
    if (laneDef.type === 'motor' && laneDef.direction === 'reverse') yMotorWB = yCenter;

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

    // Stop line is placed exactly before the central intersection box (130px before center)
    const stopLineDist = (roadSpanX / 2 - INTERSECTION_CORE_SIZE) / PIXELS_PER_METER;

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

  let xMotorSB = centerX - 25;
  let xMotorNB = centerX + 25;

  for (const laneDef of effectiveVerticalLanes) {
    const widthPx = Math.max(24, Math.round(laneDef.width * PIXELS_PER_METER));
    const xCenter = currentX + widthPx / 2;
    currentX += widthPx + 2;

    if (laneDef.type === 'motor' && laneDef.direction === 'forward') xMotorSB = xCenter;
    if (laneDef.type === 'motor' && laneDef.direction === 'reverse') xMotorNB = xCenter;

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

    // Stop line is placed exactly before the central intersection box (130px before center)
    const stopLineDist = (roadSpanY / 2 - INTERSECTION_CORE_SIZE) / PIXELS_PER_METER;

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

  // 3. Build 8 Multi-Directional Turning Connector Lanes (Smooth Bézier Arcs)
  const turningDefs: Array<{
    id: string;
    name: string;
    p0: { x: number; y: number };
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    p3: { x: number; y: number };
    stopLineDist: number;
  }> = [
    // West to South (EB -> SB Right Turn)
    {
      id: 'turn_w_s',
      name: 'West -> South Turn',
      p0: { x: leftX, y: yMotorEB },
      p1: { x: centerX - 140, y: yMotorEB },
      p2: { x: xMotorSB, y: centerY + 140 },
      p3: { x: xMotorSB, y: bottomY },
      stopLineDist: (roadSpanX / 2 - INTERSECTION_CORE_SIZE) / PIXELS_PER_METER,
    },
    // West to North (EB -> NB Left Turn)
    {
      id: 'turn_w_n',
      name: 'West -> North Turn',
      p0: { x: leftX, y: yMotorEB },
      p1: { x: centerX + 60, y: yMotorEB },
      p2: { x: xMotorNB, y: centerY - 60 },
      p3: { x: xMotorNB, y: topY },
      stopLineDist: (roadSpanX / 2 - INTERSECTION_CORE_SIZE) / PIXELS_PER_METER,
    },
    // East to North (WB -> NB Right Turn)
    {
      id: 'turn_e_n',
      name: 'East -> North Turn',
      p0: { x: rightX, y: yMotorWB },
      p1: { x: centerX + 140, y: yMotorWB },
      p2: { x: xMotorNB, y: centerY - 140 },
      p3: { x: xMotorNB, y: topY },
      stopLineDist: (roadSpanX / 2 - INTERSECTION_CORE_SIZE) / PIXELS_PER_METER,
    },
    // East to South (WB -> SB Left Turn)
    {
      id: 'turn_e_s',
      name: 'East -> South Turn',
      p0: { x: rightX, y: yMotorWB },
      p1: { x: centerX - 60, y: yMotorWB },
      p2: { x: xMotorSB, y: centerY + 60 },
      p3: { x: xMotorSB, y: bottomY },
      stopLineDist: (roadSpanX / 2 - INTERSECTION_CORE_SIZE) / PIXELS_PER_METER,
    },
    // North to West (SB -> WB Right Turn)
    {
      id: 'turn_n_w',
      name: 'North -> West Turn',
      p0: { x: xMotorSB, y: topY },
      p1: { x: xMotorSB, y: centerY - 140 },
      p2: { x: centerX - 140, y: yMotorWB },
      p3: { x: leftX, y: yMotorWB },
      stopLineDist: (roadSpanY / 2 - INTERSECTION_CORE_SIZE) / PIXELS_PER_METER,
    },
    // North to East (SB -> EB Left Turn)
    {
      id: 'turn_n_e',
      name: 'North -> East Turn',
      p0: { x: xMotorSB, y: topY },
      p1: { x: xMotorSB, y: centerY + 60 },
      p2: { x: centerX + 60, y: yMotorEB },
      p3: { x: rightX, y: yMotorEB },
      stopLineDist: (roadSpanY / 2 - INTERSECTION_CORE_SIZE) / PIXELS_PER_METER,
    },
    // South to East (NB -> EB Right Turn)
    {
      id: 'turn_s_e',
      name: 'South -> East Turn',
      p0: { x: xMotorNB, y: bottomY },
      p1: { x: xMotorNB, y: centerY + 140 },
      p2: { x: centerX + 140, y: yMotorEB },
      p3: { x: rightX, y: yMotorEB },
      stopLineDist: (roadSpanY / 2 - INTERSECTION_CORE_SIZE) / PIXELS_PER_METER,
    },
    // South to West (NB -> WB Left Turn)
    {
      id: 'turn_s_w',
      name: 'South -> West Turn',
      p0: { x: xMotorNB, y: bottomY },
      p1: { x: xMotorNB, y: centerY - 60 },
      p2: { x: centerX - 60, y: yMotorWB },
      p3: { x: leftX, y: yMotorWB },
      stopLineDist: (roadSpanY / 2 - INTERSECTION_CORE_SIZE) / PIXELS_PER_METER,
    },
  ];

  for (const tDef of turningDefs) {
    const curve: CubicBezier = { p0: tDef.p0, p1: tDef.p1, p2: tDef.p2, p3: tDef.p3 };
    const lengthPx = approximateBezierLength(curve, 28);
    const lengthMeters = lengthPx / PIXELS_PER_METER;

    lanes.push({
      id: tDef.id,
      name: tDef.name,
      type: 'motor',
      direction: 'forward',
      orientation: 'turn',
      widthMeters: 3.4,
      renderHeightPx: 50,
      yOffsetPx: centerY,
      length: lengthMeters,
      curve,
      vehicles: [],
      nextLanes: [],
      stopLine: tDef.stopLineDist,
      speedLimitKmh: 35,
    });
  }

  return { lanes, totalWidth: worldW, totalHeight: worldH };
}
