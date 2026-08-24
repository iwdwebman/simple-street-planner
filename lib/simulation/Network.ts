// Bézier Road Network & 5x Multi-Corridor Lane Graph Builder with Right-Hand Traffic & Median Islands

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
 * Generate 5x Bézier road network with strict Right-Hand Traffic (RHT), parallel turn pockets, and median islands
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

  // --- 1. East-West Corridor (Right-Hand Traffic: WB on North half, EB on South half) ---
  // North half (y < centerY): Westbound traffic
  const yWalkWB = centerY - 92;
  const yBikeWB = centerY - 68;
  const yTurnRightWB = centerY - 46;
  const yThroughWB = centerY - 24;
  const yTurnLeftWB = centerY - 6;

  // South half (y > centerY): Eastbound traffic
  const yTurnLeftEB = centerY + 6;
  const yThroughEB = centerY + 24;
  const yTurnRightEB = centerY + 46;
  const yBikeEB = centerY + 68;
  const yWalkEB = centerY + 92;

  // --- 2. North-South Corridor (Right-Hand Traffic: SB on West half, NB on East half) ---
  // West half (x < centerX): Southbound traffic
  const xWalkSB = centerX - 92;
  const xBikeSB = centerX - 68;
  const xTurnRightSB = centerX - 46;
  const xThroughSB = centerX - 24;
  const xTurnLeftSB = centerX - 6;

  // East half (x > centerX): Northbound traffic
  const xTurnLeftNB = centerX + 6;
  const xThroughNB = centerX + 24;
  const xTurnRightNB = centerX + 46;
  const xBikeNB = centerX + 68;
  const xWalkNB = centerX + 92;

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
      renderHeightPx: type === 'sidewalk' ? 26 : type === 'bike' ? 22 : 28,
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
      renderHeightPx: type === 'sidewalk' ? 26 : type === 'bike' ? 22 : 28,
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

  // --- 1. Through & Sidewalk / Bike Lanes (Strict RHT) ---
  // North Sidewalk (Westbound pedestrians)
  addStraightHorizontal('sidewalk_wb', 'North Sidewalk WB', 'sidewalk', yWalkWB, 'reverse', 5);
  // WB Bike Lane (Westbound cyclists on right side)
  addStraightHorizontal('bike_wb', 'Westbound Protected Bike', 'bike', yBikeWB, 'reverse', 20);
  // WB Through Lane (Motor traffic on right side)
  addStraightHorizontal('travel_wb_1', 'Boulevard WB Through', 'motor', yThroughWB, 'reverse', 50);

  // EB Through Lane (Motor traffic on right side)
  addStraightHorizontal('travel_eb_1', 'Boulevard EB Through', 'motor', yThroughEB, 'forward', 50);
  addStraightHorizontal('transit_eb', 'BRT Transit EB', 'transit', yTurnRightEB, 'forward', 45);
  // EB Bike Lane (Eastbound cyclists on right side)
  addStraightHorizontal('bike_eb', 'Eastbound Protected Bike', 'bike', yBikeEB, 'forward', 20);
  // South Sidewalk (Eastbound pedestrians)
  addStraightHorizontal('sidewalk_eb', 'South Sidewalk EB', 'sidewalk', yWalkEB, 'forward', 5);

  // West Sidewalk (Southbound pedestrians)
  addStraightVertical('ns_walk_sb', 'West Sidewalk SB', 'sidewalk', xWalkSB, 'forward', 5);
  // SB Bike Lane (Southbound cyclists on right side)
  addStraightVertical('ns_bike_sb', 'Southbound Bike SB', 'bike', xBikeSB, 'forward', 20);
  // SB Through Lane (Motor traffic on right side)
  addStraightVertical('ns_travel_sb', 'Avenue SB Through', 'motor', xThroughSB, 'forward', 45);

  // NB Through Lane (Motor traffic on right side)
  addStraightVertical('ns_travel_nb', 'Avenue NB Through', 'motor', xThroughNB, 'reverse', 45);
  // NB Bike Lane (Northbound cyclists on right side)
  addStraightVertical('ns_bike_nb', 'Northbound Bike NB', 'bike', xBikeNB, 'reverse', 20);
  // East Sidewalk (Northbound pedestrians)
  addStraightVertical('ns_walk_nb', 'East Sidewalk NB', 'sidewalk', xWalkNB, 'reverse', 5);

  // --- 2. Dedicated Turning Pocket Lanes (RHT Geometry) ---
  // Eastbound Left Turn Pocket (EB -> NB) (branching from median side)
  const curveTurnLeftEB: CubicBezier = {
    p0: { x: leftX, y: yTurnLeftEB },
    p1: { x: centerX - INTERSECTION_CORE_SIZE, y: yTurnLeftEB },
    p2: { x: xThroughNB, y: centerY + 10 },
    p3: { x: xThroughNB, y: topY },
  };
  lanes.push({
    id: 'turn_left_eb',
    name: 'Eastbound Left Turn Pocket',
    type: 'turn_left',
    direction: 'forward',
    orientation: 'turn',
    widthMeters: 3.2,
    renderHeightPx: 28,
    yOffsetPx: yTurnLeftEB,
    length: approximateBezierLength(curveTurnLeftEB, 28) / PIXELS_PER_METER,
    curve: curveTurnLeftEB,
    vehicles: [],
    nextLanes: [],
    stopLine: stopLineEB,
    speedLimitKmh: 35,
  });

  // Eastbound Right Turn Pocket (EB -> SB)
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
    renderHeightPx: 28,
    yOffsetPx: yTurnRightEB,
    length: approximateBezierLength(curveTurnRightEB, 28) / PIXELS_PER_METER,
    curve: curveTurnRightEB,
    vehicles: [],
    nextLanes: [],
    stopLine: stopLineEB,
    speedLimitKmh: 30,
  });

  // Westbound Left Turn Pocket (WB -> SB)
  const curveTurnLeftWB: CubicBezier = {
    p0: { x: rightX, y: yTurnLeftWB },
    p1: { x: centerX + INTERSECTION_CORE_SIZE, y: yTurnLeftWB },
    p2: { x: xThroughSB, y: centerY - 10 },
    p3: { x: xThroughSB, y: bottomY },
  };
  lanes.push({
    id: 'turn_left_wb',
    name: 'Westbound Left Turn Pocket',
    type: 'turn_left',
    direction: 'reverse',
    orientation: 'turn',
    widthMeters: 3.2,
    renderHeightPx: 28,
    yOffsetPx: yTurnLeftWB,
    length: approximateBezierLength(curveTurnLeftWB, 28) / PIXELS_PER_METER,
    curve: curveTurnLeftWB,
    vehicles: [],
    nextLanes: [],
    stopLine: stopLineWB,
    speedLimitKmh: 35,
  });

  // Westbound Right Turn Pocket (WB -> NB)
  const curveTurnRightWB: CubicBezier = {
    p0: { x: rightX, y: yTurnRightWB },
    p1: { x: centerX + INTERSECTION_CORE_SIZE, y: yTurnRightWB },
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
    renderHeightPx: 28,
    yOffsetPx: yTurnRightWB,
    length: approximateBezierLength(curveTurnRightWB, 28) / PIXELS_PER_METER,
    curve: curveTurnRightWB,
    vehicles: [],
    nextLanes: [],
    stopLine: stopLineWB,
    speedLimitKmh: 30,
  });

  // Southbound Left Turn Pocket (SB -> EB)
  const curveTurnLeftSB: CubicBezier = {
    p0: { x: xTurnLeftSB, y: topY },
    p1: { x: xTurnLeftSB, y: centerY - INTERSECTION_CORE_SIZE },
    p2: { x: centerX - 10, y: yThroughEB },
    p3: { x: rightX, y: yThroughEB },
  };
  lanes.push({
    id: 'turn_left_sb',
    name: 'Southbound Left Turn Pocket',
    type: 'turn_left',
    direction: 'forward',
    orientation: 'turn',
    widthMeters: 3.2,
    renderHeightPx: 28,
    yOffsetPx: centerY,
    xOffsetPx: xTurnLeftSB,
    length: approximateBezierLength(curveTurnLeftSB, 28) / PIXELS_PER_METER,
    curve: curveTurnLeftSB,
    vehicles: [],
    nextLanes: [],
    stopLine: stopLineSB,
    speedLimitKmh: 35,
  });

  // Southbound Right Turn Pocket (SB -> WB)
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
    renderHeightPx: 28,
    yOffsetPx: centerY,
    xOffsetPx: xTurnRightSB,
    length: approximateBezierLength(curveTurnRightSB, 28) / PIXELS_PER_METER,
    curve: curveTurnRightSB,
    vehicles: [],
    nextLanes: [],
    stopLine: stopLineSB,
    speedLimitKmh: 30,
  });

  // Northbound Left Turn Pocket (NB -> WB)
  const curveTurnLeftNB: CubicBezier = {
    p0: { x: xTurnLeftNB, y: bottomY },
    p1: { x: xTurnLeftNB, y: centerY + INTERSECTION_CORE_SIZE },
    p2: { x: centerX + 10, y: yThroughWB },
    p3: { x: leftX, y: yThroughWB },
  };
  lanes.push({
    id: 'turn_left_nb',
    name: 'Northbound Left Turn Pocket',
    type: 'turn_left',
    direction: 'reverse',
    orientation: 'turn',
    widthMeters: 3.2,
    renderHeightPx: 28,
    yOffsetPx: centerY,
    xOffsetPx: xTurnLeftNB,
    length: approximateBezierLength(curveTurnLeftNB, 28) / PIXELS_PER_METER,
    curve: curveTurnLeftNB,
    vehicles: [],
    nextLanes: [],
    stopLine: stopLineNB,
    speedLimitKmh: 35,
  });

  // Northbound Right Turn Pocket (NB -> EB)
  const curveTurnRightNB: CubicBezier = {
    p0: { x: xTurnRightNB, y: bottomY },
    p1: { x: xTurnRightNB, y: centerY + INTERSECTION_CORE_SIZE },
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
    renderHeightPx: 28,
    yOffsetPx: centerY,
    xOffsetPx: xTurnRightNB,
    length: approximateBezierLength(curveTurnRightNB, 28) / PIXELS_PER_METER,
    curve: curveTurnRightNB,
    vehicles: [],
    nextLanes: [],
    stopLine: stopLineNB,
    speedLimitKmh: 30,
  });

  // --- 3. Pedestrian Crosswalk Lanes (Walkers cross along designated crosswalks) ---
  const pedTurnDefs: Array<{
    id: string;
    name: string;
    p0: { x: number; y: number };
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    p3: { x: number; y: number };
    stopLineDist: number;
  }> = [
    // West Crosswalk (South Sidewalk -> North Sidewalk across West road mouth)
    {
      id: 'walk_turn_w_n',
      name: 'West Crosswalk Northbound',
      p0: { x: leftX, y: yWalkEB },
      p1: { x: centerX - INTERSECTION_CORE_SIZE - 12, y: yWalkEB },
      p2: { x: centerX - INTERSECTION_CORE_SIZE - 12, y: yWalkWB },
      p3: { x: leftX, y: yWalkWB },
      stopLineDist: stopLineEB,
    },
    // West Crosswalk Southbound (North Sidewalk -> South Sidewalk)
    {
      id: 'walk_turn_w_s',
      name: 'West Crosswalk Southbound',
      p0: { x: leftX, y: yWalkWB },
      p1: { x: centerX - INTERSECTION_CORE_SIZE - 12, y: yWalkWB },
      p2: { x: xWalkSB, y: centerY + INTERSECTION_CORE_SIZE + 12 },
      p3: { x: xWalkSB, y: bottomY },
      stopLineDist: stopLineEB,
    },
    // East Crosswalk (North Sidewalk -> South Sidewalk across East road mouth)
    {
      id: 'walk_turn_e_s',
      name: 'East Crosswalk Southbound',
      p0: { x: rightX, y: yWalkWB },
      p1: { x: centerX + INTERSECTION_CORE_SIZE + 12, y: yWalkWB },
      p2: { x: centerX + INTERSECTION_CORE_SIZE + 12, y: yWalkEB },
      p3: { x: rightX, y: yWalkEB },
      stopLineDist: stopLineWB,
    },
    // East Crosswalk Northbound (South Sidewalk -> North Sidewalk)
    {
      id: 'walk_turn_e_n',
      name: 'East Crosswalk Northbound',
      p0: { x: rightX, y: yWalkEB },
      p1: { x: centerX + INTERSECTION_CORE_SIZE + 12, y: yWalkEB },
      p2: { x: xWalkNB, y: centerY - INTERSECTION_CORE_SIZE - 12 },
      p3: { x: xWalkNB, y: topY },
      stopLineDist: stopLineWB,
    },
    // North Crosswalk (West Sidewalk -> East Sidewalk across North road mouth)
    {
      id: 'walk_turn_n_e',
      name: 'North Crosswalk Eastbound',
      p0: { x: xWalkSB, y: topY },
      p1: { x: xWalkSB, y: centerY - INTERSECTION_CORE_SIZE - 12 },
      p2: { x: xWalkNB, y: centerY - INTERSECTION_CORE_SIZE - 12 },
      p3: { x: xWalkNB, y: topY },
      stopLineDist: stopLineSB,
    },
    // North Crosswalk Westbound (East Sidewalk -> West Sidewalk)
    {
      id: 'walk_turn_n_w',
      name: 'North Crosswalk Westbound',
      p0: { x: xWalkNB, y: topY },
      p1: { x: xWalkNB, y: centerY - INTERSECTION_CORE_SIZE - 12 },
      p2: { x: centerX - INTERSECTION_CORE_SIZE - 12, y: yWalkWB },
      p3: { x: leftX, y: yWalkWB },
      stopLineDist: stopLineSB,
    },
    // South Crosswalk (East Sidewalk -> West Sidewalk across South road mouth)
    {
      id: 'walk_turn_s_w',
      name: 'South Crosswalk Westbound',
      p0: { x: xWalkNB, y: bottomY },
      p1: { x: xWalkNB, y: centerY + INTERSECTION_CORE_SIZE + 12 },
      p2: { x: xWalkSB, y: centerY + INTERSECTION_CORE_SIZE + 12 },
      p3: { x: xWalkSB, y: bottomY },
      stopLineDist: stopLineNB,
    },
    // South Crosswalk Eastbound (West Sidewalk -> East Sidewalk)
    {
      id: 'walk_turn_s_e',
      name: 'South Crosswalk Eastbound',
      p0: { x: xWalkSB, y: bottomY },
      p1: { x: xWalkSB, y: centerY + INTERSECTION_CORE_SIZE + 12 },
      p2: { x: centerX + INTERSECTION_CORE_SIZE + 12, y: yWalkEB },
      p3: { x: rightX, y: yWalkEB },
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
      renderHeightPx: 26,
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
