// Bézier Road Network & 5x Multi-Corridor Lane Graph Builder with Parallel Turn Bays & Crossroads Geometry

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
  xOffsetPx?: number;
  yOffsetPx: number;
  length: number;
  curve: CubicBezier;
  vehicles: Vehicle[];
  nextLanes: string[];
  stopLine?: number;
  speedLimitKmh: number;
}

export const PIXELS_PER_METER = 16;
export const DEFAULT_WORLD_WIDTH = 3200;
export const DEFAULT_WORLD_HEIGHT = 2400;
export const MARGIN_PORTAL = 40;
export const INTERSECTION_CORE_SIZE = 130; // px half-size of central crossroads

/**
 * Generate 5x Bézier road network with parallel turn pocket lanes and intersection turning curves
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

  const leftX = MARGIN_PORTAL;
  const rightX = worldW - MARGIN_PORTAL;
  const topY = MARGIN_PORTAL;
  const bottomY = worldH - MARGIN_PORTAL;

  const roadSpanX = rightX - leftX;
  const roadSpanY = bottomY - topY;

  // Approach stop line distances
  const stopLineEB = (roadSpanX / 2 - INTERSECTION_CORE_SIZE) / PIXELS_PER_METER;
  const stopLineWB = (roadSpanX / 2 - INTERSECTION_CORE_SIZE) / PIXELS_PER_METER;
  const stopLineSB = (roadSpanY / 2 - INTERSECTION_CORE_SIZE) / PIXELS_PER_METER;
  const stopLineNB = (roadSpanY / 2 - INTERSECTION_CORE_SIZE) / PIXELS_PER_METER;

  // --- 1. East-West Corridor Layout (Straight Parallel Lanes) ---
  // Y-offsets from top to bottom:
  // North Sidewalk: centerY - 90
  // EB Bike Lane: centerY - 65
  // EB Left Turn Pocket: centerY - 40
  // EB Through Travel: centerY - 15
  // EB Right Turn Pocket: centerY + 10 (or through 2)
  // WB Left Turn Pocket: centerY + 15
  // WB Through Travel: centerY + 40
  // WB Bike Lane: centerY + 65
  // South Sidewalk: centerY + 90

  const yWalkEB = centerY - 90;
  const yBikeEB = centerY - 65;
  const yTurnLeftEB = centerY - 40;
  const yThroughEB = centerY - 15;
  const yTurnRightEB = centerY + 10;

  const yTurnLeftWB = centerY + 15;
  const yThroughWB = centerY + 40;
  const yBikeWB = centerY + 65;
  const yWalkWB = centerY + 90;

  // --- 2. North-South Corridor Layout (Straight Parallel Lanes) ---
  // X-offsets from left to right:
  // West Avenue Sidewalk: centerX - 90
  // SB Bike Lane: centerX - 65
  // SB Right Turn Pocket: centerX - 40
  // SB Through Travel: centerX - 15
  // SB Left Turn Pocket: centerX + 10
  // NB Left Turn Pocket: centerX - 10
  // NB Through Travel: centerX + 15
  // NB Bike Lane: centerX + 65
  // East Avenue Sidewalk: centerX + 90

  const xWalkNB = centerX - 90;
  const xBikeNB = centerX - 65;
  const xTurnRightSB = centerX - 40;
  const xThroughSB = centerX - 15;
  const xTurnLeftSB = centerX + 10;

  const xTurnLeftNB = centerX - 10;
  const xThroughNB = centerX + 15;
  const xBikeSB = centerX + 65;
  const xWalkSB = centerX + 90;

  // Helper to add straight horizontal lane
  const addStraightHorizontal = (id: string, name: string, type: LaneType, y: number, dir: LaneDirection, speedLimit: number) => {
    let p0 = { x: leftX, y };
    let p3 = { x: rightX, y };
    if (dir === 'reverse') {
      p0 = { x: rightX, y };
      p3 = { x: leftX, y };
    }
    const curve: CubicBezier = {
      p0,
      p1: { x: p0.x + (p3.x - p0.x) / 3, y },
      p2: { x: p0.x + (2 * (p3.x - p0.x)) / 3, y },
      p3,
    };
    const lengthMeters = roadSpanX / PIXELS_PER_METER;
    lanes.push({
      id,
      name,
      type,
      direction: dir,
      orientation: 'horizontal',
      widthMeters: 3.4,
      renderHeightPx: type === 'sidewalk' ? 28 : type === 'bike' ? 24 : 30,
      yOffsetPx: y,
      length: lengthMeters,
      curve,
      vehicles: [],
      nextLanes: [],
      stopLine: stopLineEB,
      speedLimitKmh: speedLimit,
    });
  };

  // Helper to add straight vertical lane
  const addStraightVertical = (id: string, name: string, type: LaneType, x: number, dir: LaneDirection, speedLimit: number) => {
    let p0 = { x, y: topY };
    let p3 = { x, y: bottomY };
    if (dir === 'reverse') {
      p0 = { x, y: bottomY };
      p3 = { x, y: topY };
    }
    const curve: CubicBezier = {
      p0,
      p1: { x, y: p0.y + (p3.y - p0.y) / 3 },
      p2: { x, y: p0.y + (2 * (p3.y - p0.y)) / 3 },
      p3,
    };
    const lengthMeters = roadSpanY / PIXELS_PER_METER;
    lanes.push({
      id,
      name,
      type,
      direction: dir,
      orientation: 'vertical',
      widthMeters: 3.4,
      renderHeightPx: type === 'sidewalk' ? 28 : type === 'bike' ? 24 : 30,
      xOffsetPx: x,
      yOffsetPx: centerY,
      length: lengthMeters,
      curve,
      vehicles: [],
      nextLanes: [],
      stopLine: stopLineSB,
      speedLimitKmh: speedLimit,
    });
  };

  // 1. Through & Walk/Bike Lanes
  addStraightHorizontal('sidewalk_eb', 'North Sidewalk EB', 'sidewalk', yWalkEB, 'forward', 5);
  addStraightHorizontal('bike_eb', 'Protected Bike EB', 'bike', yBikeEB, 'forward', 20);
  addStraightHorizontal('travel_eb_1', 'Boulevard EB Through', 'motor', yThroughEB, 'forward', 50);
  addStraightHorizontal('transit_eb', 'BRT Transit EB', 'transit', yTurnRightEB, 'forward', 45);

  addStraightHorizontal('travel_wb_1', 'Boulevard WB Through', 'motor', yThroughWB, 'reverse', 50);
  addStraightHorizontal('bike_wb', 'Protected Bike WB', 'bike', yBikeWB, 'reverse', 20);
  addStraightHorizontal('sidewalk_wb', 'South Sidewalk WB', 'sidewalk', yWalkWB, 'reverse', 5);

  addStraightVertical('ns_walk_nb', 'West Sidewalk NB', 'sidewalk', xWalkNB, 'reverse', 5);
  addStraightVertical('ns_bike_nb', 'West Bike NB', 'bike', xBikeNB, 'reverse', 20);
  addStraightVertical('ns_travel_sb', 'Avenue SB Through', 'motor', xThroughSB, 'forward', 45);

  addStraightVertical('ns_travel_nb', 'Avenue NB Through', 'motor', xThroughNB, 'reverse', 45);
  addStraightVertical('ns_bike_sb', 'East Bike SB', 'bike', xBikeSB, 'forward', 20);
  addStraightVertical('ns_walk_sb', 'East Sidewalk SB', 'sidewalk', xWalkSB, 'forward', 5);

  // 2. Dedicated Turning Pocket Lanes (Straight on approach -> 90-deg turn inside intersection box)
  // Eastbound Left Turn (EB -> NB)
  const curveTurnLeftEB: CubicBezier = {
    p0: { x: leftX, y: yTurnLeftEB },
    p1: { x: centerX - INTERSECTION_CORE_SIZE, y: yTurnLeftEB },
    p2: { x: xThroughNB, y: centerY + 20 },
    p3: { x: xThroughNB, y: topY },
  };
  lanes.push({
    id: 'turn_left_eb',
    name: 'Eastbound Left Turn Pocket',
    type: 'turn_left',
    direction: 'forward',
    orientation: 'turn',
    widthMeters: 3.2,
    renderHeightPx: 30,
    yOffsetPx: yTurnLeftEB,
    length: approximateBezierLength(curveTurnLeftEB, 28) / PIXELS_PER_METER,
    curve: curveTurnLeftEB,
    vehicles: [],
    nextLanes: [],
    stopLine: stopLineEB,
    speedLimitKmh: 35,
  });

  // Eastbound Right Turn (EB -> SB)
  const curveTurnRightEB: CubicBezier = {
    p0: { x: leftX, y: yTurnRightEB },
    p1: { x: centerX - INTERSECTION_CORE_SIZE, y: yTurnRightEB },
    p2: { x: xThroughSB, y: centerY + INTERSECTION_CORE_SIZE },
    p3: { x: xThroughSB, y: bottomY },
  };
  lanes.push({
    id: 'turn_right_eb',
    name: 'Eastbound Right Turn Pocket',
    type: 'turn_right',
    direction: 'forward',
    orientation: 'turn',
    widthMeters: 3.2,
    renderHeightPx: 30,
    yOffsetPx: yTurnRightEB,
    length: approximateBezierLength(curveTurnRightEB, 28) / PIXELS_PER_METER,
    curve: curveTurnRightEB,
    vehicles: [],
    nextLanes: [],
    stopLine: stopLineEB,
    speedLimitKmh: 30,
  });

  // Westbound Left Turn (WB -> SB)
  const curveTurnLeftWB: CubicBezier = {
    p0: { x: rightX, y: yTurnLeftWB },
    p1: { x: centerX + INTERSECTION_CORE_SIZE, y: yTurnLeftWB },
    p2: { x: xThroughSB, y: centerY - 20 },
    p3: { x: xThroughSB, y: bottomY },
  };
  lanes.push({
    id: 'turn_left_wb',
    name: 'Westbound Left Turn Pocket',
    type: 'turn_left',
    direction: 'reverse',
    orientation: 'turn',
    widthMeters: 3.2,
    renderHeightPx: 30,
    yOffsetPx: yTurnLeftWB,
    length: approximateBezierLength(curveTurnLeftWB, 28) / PIXELS_PER_METER,
    curve: curveTurnLeftWB,
    vehicles: [],
    nextLanes: [],
    stopLine: stopLineWB,
    speedLimitKmh: 35,
  });

  // Westbound Right Turn (WB -> NB)
  const curveTurnRightWB: CubicBezier = {
    p0: { x: rightX, y: yThroughWB },
    p1: { x: centerX + INTERSECTION_CORE_SIZE, y: yThroughWB },
    p2: { x: xThroughNB, y: centerY - INTERSECTION_CORE_SIZE },
    p3: { x: xThroughNB, y: topY },
  };
  lanes.push({
    id: 'turn_right_wb',
    name: 'Westbound Right Turn Pocket',
    type: 'turn_right',
    direction: 'reverse',
    orientation: 'turn',
    widthMeters: 3.2,
    renderHeightPx: 30,
    yOffsetPx: yThroughWB,
    length: approximateBezierLength(curveTurnRightWB, 28) / PIXELS_PER_METER,
    curve: curveTurnRightWB,
    vehicles: [],
    nextLanes: [],
    stopLine: stopLineWB,
    speedLimitKmh: 30,
  });

  // Southbound Left Turn (SB -> EB)
  const curveTurnLeftSB: CubicBezier = {
    p0: { x: xTurnLeftSB, y: topY },
    p1: { x: xTurnLeftSB, y: centerY - INTERSECTION_CORE_SIZE },
    p2: { x: centerX - 20, y: yThroughEB },
    p3: { x: rightX, y: yThroughEB },
  };
  lanes.push({
    id: 'turn_left_sb',
    name: 'Southbound Left Turn Pocket',
    type: 'turn_left',
    direction: 'forward',
    orientation: 'turn',
    widthMeters: 3.2,
    renderHeightPx: 30,
    yOffsetPx: centerY,
    xOffsetPx: xTurnLeftSB,
    length: approximateBezierLength(curveTurnLeftSB, 28) / PIXELS_PER_METER,
    curve: curveTurnLeftSB,
    vehicles: [],
    nextLanes: [],
    stopLine: stopLineSB,
    speedLimitKmh: 35,
  });

  // Southbound Right Turn (SB -> WB)
  const curveTurnRightSB: CubicBezier = {
    p0: { x: xTurnRightSB, y: topY },
    p1: { x: xTurnRightSB, y: centerY - INTERSECTION_CORE_SIZE },
    p2: { x: centerX - INTERSECTION_CORE_SIZE, y: yThroughWB },
    p3: { x: leftX, y: yThroughWB },
  };
  lanes.push({
    id: 'turn_right_sb',
    name: 'Southbound Right Turn Pocket',
    type: 'turn_right',
    direction: 'forward',
    orientation: 'turn',
    widthMeters: 3.2,
    renderHeightPx: 30,
    yOffsetPx: centerY,
    xOffsetPx: xTurnRightSB,
    length: approximateBezierLength(curveTurnRightSB, 28) / PIXELS_PER_METER,
    curve: curveTurnRightSB,
    vehicles: [],
    nextLanes: [],
    stopLine: stopLineSB,
    speedLimitKmh: 30,
  });

  // Northbound Left Turn (NB -> WB)
  const curveTurnLeftNB: CubicBezier = {
    p0: { x: xTurnLeftNB, y: bottomY },
    p1: { x: xTurnLeftNB, y: centerY + INTERSECTION_CORE_SIZE },
    p2: { x: centerX + 20, y: yThroughWB },
    p3: { x: leftX, y: yThroughWB },
  };
  lanes.push({
    id: 'turn_left_nb',
    name: 'Northbound Left Turn Pocket',
    type: 'turn_left',
    direction: 'reverse',
    orientation: 'turn',
    widthMeters: 3.2,
    renderHeightPx: 30,
    yOffsetPx: centerY,
    xOffsetPx: xTurnLeftNB,
    length: approximateBezierLength(curveTurnLeftNB, 28) / PIXELS_PER_METER,
    curve: curveTurnLeftNB,
    vehicles: [],
    nextLanes: [],
    stopLine: stopLineNB,
    speedLimitKmh: 35,
  });

  // Northbound Right Turn (NB -> EB)
  const curveTurnRightNB: CubicBezier = {
    p0: { x: xThroughNB, y: bottomY },
    p1: { x: xThroughNB, y: centerY + INTERSECTION_CORE_SIZE },
    p2: { x: centerX + INTERSECTION_CORE_SIZE, y: yThroughEB },
    p3: { x: rightX, y: yThroughEB },
  };
  lanes.push({
    id: 'turn_right_nb',
    name: 'Northbound Right Turn Pocket',
    type: 'turn_right',
    direction: 'reverse',
    orientation: 'turn',
    widthMeters: 3.2,
    renderHeightPx: 30,
    yOffsetPx: centerY,
    xOffsetPx: xThroughNB,
    length: approximateBezierLength(curveTurnRightNB, 28) / PIXELS_PER_METER,
    curve: curveTurnRightNB,
    vehicles: [],
    nextLanes: [],
    stopLine: stopLineNB,
    speedLimitKmh: 30,
  });

  // 3. Pedestrian Crosswalk & Turn Connectors (Crossing neatly at intersection crosswalks)
  const pedTurnDefs: Array<{
    id: string;
    name: string;
    p0: { x: number; y: number };
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    p3: { x: number; y: number };
    stopLineDist: number;
  }> = [
    {
      id: 'walk_turn_w_s',
      name: 'Pedestrian Cross West -> South',
      p0: { x: leftX, y: yWalkEB },
      p1: { x: centerX - INTERSECTION_CORE_SIZE - 20, y: yWalkEB },
      p2: { x: xWalkSB, y: centerY + INTERSECTION_CORE_SIZE + 20 },
      p3: { x: xWalkSB, y: bottomY },
      stopLineDist: stopLineEB,
    },
    {
      id: 'walk_turn_w_n',
      name: 'Pedestrian Cross West -> North',
      p0: { x: leftX, y: yWalkEB },
      p1: { x: centerX - INTERSECTION_CORE_SIZE - 20, y: yWalkEB },
      p2: { x: xWalkNB, y: centerY - INTERSECTION_CORE_SIZE - 20 },
      p3: { x: xWalkNB, y: topY },
      stopLineDist: stopLineEB,
    },
    {
      id: 'walk_turn_e_n',
      name: 'Pedestrian Cross East -> North',
      p0: { x: rightX, y: yWalkWB },
      p1: { x: centerX + INTERSECTION_CORE_SIZE + 20, y: yWalkWB },
      p2: { x: xWalkNB, y: centerY - INTERSECTION_CORE_SIZE - 20 },
      p3: { x: xWalkNB, y: topY },
      stopLineDist: stopLineWB,
    },
    {
      id: 'walk_turn_e_s',
      name: 'Pedestrian Cross East -> South',
      p0: { x: rightX, y: yWalkWB },
      p1: { x: centerX + INTERSECTION_CORE_SIZE + 20, y: yWalkWB },
      p2: { x: xWalkSB, y: centerY + INTERSECTION_CORE_SIZE + 20 },
      p3: { x: xWalkSB, y: bottomY },
      stopLineDist: stopLineWB,
    },
    {
      id: 'walk_turn_n_w',
      name: 'Pedestrian Cross North -> West',
      p0: { x: xWalkSB, y: topY },
      p1: { x: xWalkSB, y: centerY - INTERSECTION_CORE_SIZE - 20 },
      p2: { x: centerX - INTERSECTION_CORE_SIZE - 20, y: yWalkWB },
      p3: { x: leftX, y: yWalkWB },
      stopLineDist: stopLineSB,
    },
    {
      id: 'walk_turn_n_e',
      name: 'Pedestrian Cross North -> East',
      p0: { x: xWalkSB, y: topY },
      p1: { x: xWalkSB, y: centerY - INTERSECTION_CORE_SIZE - 20 },
      p2: { x: centerX + INTERSECTION_CORE_SIZE + 20, y: yWalkEB },
      p3: { x: rightX, y: yWalkEB },
      stopLineDist: stopLineSB,
    },
    {
      id: 'walk_turn_s_e',
      name: 'Pedestrian Cross South -> East',
      p0: { x: xWalkNB, y: bottomY },
      p1: { x: xWalkNB, y: centerY + INTERSECTION_CORE_SIZE + 20 },
      p2: { x: centerX + INTERSECTION_CORE_SIZE + 20, y: yWalkEB },
      p3: { x: rightX, y: yWalkEB },
      stopLineDist: stopLineNB,
    },
    {
      id: 'walk_turn_s_w',
      name: 'Pedestrian Cross South -> West',
      p0: { x: xWalkNB, y: bottomY },
      p1: { x: xWalkNB, y: centerY + INTERSECTION_CORE_SIZE + 20 },
      p2: { x: centerX - INTERSECTION_CORE_SIZE - 20, y: yWalkWB },
      p3: { x: leftX, y: yWalkWB },
      stopLineDist: stopLineNB,
    },
  ];

  for (const pDef of pedTurnDefs) {
    const curve: CubicBezier = { p0: pDef.p0, p1: pDef.p1, p2: pDef.p2, p3: pDef.p3 };
    const lengthPx = approximateBezierLength(curve, 28);
    const lengthMeters = lengthPx / PIXELS_PER_METER;

    lanes.push({
      id: pDef.id,
      name: pDef.name,
      type: 'sidewalk',
      direction: 'forward',
      orientation: 'turn',
      widthMeters: 2.6,
      renderHeightPx: 28,
      yOffsetPx: centerY,
      length: lengthMeters,
      curve,
      vehicles: [],
      nextLanes: [],
      stopLine: pDef.stopLineDist,
      speedLimitKmh: 5,
    });
  }

  return { lanes, totalWidth: worldW, totalHeight: worldH };
}
