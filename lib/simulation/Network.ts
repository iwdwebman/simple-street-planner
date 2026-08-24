// Real-World Piecewise Lane Geometry & Precision 4-Way Crossroads Network

import { Vehicle } from './Vehicle';
import { LaneType, LaneDirection, StreetConfig, LaneDefinition } from '../types/street';
import { CubicBezier, evaluateBezierFull, approximateBezierLength } from './Curvature';

export { evaluateBezierFull, approximateBezierLength };
export type { CubicBezier };

export interface PiecewisePath {
  appStart: { x: number; y: number };
  stopPt: { x: number; y: number };
  depStart: { x: number; y: number };
  depEnd: { x: number; y: number };
  appLenM: number;
  turnLenM: number;
  depLenM: number;
  totalLenM: number;
  turnCurve: CubicBezier;
}

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
  piecewise?: PiecewisePath;
  vehicles: Vehicle[];
  nextLanes: string[];
  stopLine?: number;
  speedLimitKmh: number;
}

export const PIXELS_PER_METER = 16;
export const DEFAULT_WORLD_WIDTH = 3200;
export const DEFAULT_WORLD_HEIGHT = 2400;
export const MARGIN_PORTAL = 40;
export const INTERSECTION_RADIUS = 100; // px half-size of crossroads junction box

/**
 * Evaluate vehicle position and angle along any lane (guaranteeing 100% straight approach/departure and junction-only turning)
 */
export function evaluateLanePosition(
  lane: LaneSegment,
  sMeters: number,
): { x: number; y: number; angle: number; maxSafeSpeed: number } {
  if (lane.piecewise) {
    const pw = lane.piecewise;
    const s = Math.max(0, Math.min(pw.totalLenM, sMeters));

    // Stage 1: Approach (100% straight parallel lane)
    if (s <= pw.appLenM) {
      const t = pw.appLenM > 0 ? s / pw.appLenM : 0;
      const x = pw.appStart.x + (pw.stopPt.x - pw.appStart.x) * t;
      const y = pw.appStart.y + (pw.stopPt.y - pw.appStart.y) * t;
      const angle = Math.atan2(pw.stopPt.y - pw.appStart.y, pw.stopPt.x - pw.appStart.x);
      return { x, y, angle, maxSafeSpeed: (lane.speedLimitKmh || 50) / 3.6 };
    }

    // Stage 2: Departure (100% straight parallel lane)
    if (s >= pw.appLenM + pw.turnLenM) {
      const sDep = s - (pw.appLenM + pw.turnLenM);
      const t = pw.depLenM > 0 ? sDep / pw.depLenM : 1;
      const x = pw.depStart.x + (pw.depEnd.x - pw.depStart.x) * t;
      const y = pw.depStart.y + (pw.depEnd.y - pw.depStart.y) * t;
      const angle = Math.atan2(pw.depEnd.y - pw.depStart.y, pw.depEnd.x - pw.depStart.x);
      return { x, y, angle, maxSafeSpeed: (lane.speedLimitKmh || 50) / 3.6 };
    }

    // Stage 3: Inside Intersection Junction Box Only
    const tTurn = pw.turnLenM > 0 ? (s - pw.appLenM) / pw.turnLenM : 0;
    const pt = evaluateBezierFull(pw.turnCurve, tTurn);
    return { x: pt.x, y: pt.y, angle: pt.angle, maxSafeSpeed: 30 / 3.6 };
  }

  // Fallback for straight through lanes
  const t = Math.max(0, Math.min(1, sMeters / Math.max(0.1, lane.length)));
  return evaluateBezierFull(lane.curve, t);
}

/**
 * Build Full 5x Multi-Corridor Road Network with Visible Parallel Turn Pocket Bays
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

  const R = INTERSECTION_RADIUS; // 100px

  const stopX_EB = centerX - R;
  const stopX_WB = centerX + R;
  const stopY_SB = centerY - R;
  const stopY_NB = centerY + R;

  const stopDistEW = (centerX - R - leftX) / PIXELS_PER_METER;
  const stopDistNS = (centerY - R - topY) / PIXELS_PER_METER;

  // --- Real-World Right-Hand Traffic (RHT) Cross-Section Geometry ---
  // East-West Corridor Y-offsets (North side = Westbound, South side = Eastbound)
  const yWalkWB = centerY - 84;
  const yBikeWB = centerY - 64;
  const yTurnRightWB = centerY - 44;
  const yThroughWB = centerY - 24;
  const yTurnLeftWB = centerY - 8;

  const yTurnLeftEB = centerY + 8;
  const yThroughEB = centerY + 24;
  const yTurnRightEB = centerY + 44;
  const yBikeEB = centerY + 64;
  const yWalkEB = centerY + 84;

  // North-South Corridor X-offsets (West side = Southbound, East side = Northbound)
  const xWalkSB = centerX - 84;
  const xBikeSB = centerX - 64;
  const xTurnRightSB = centerX - 44;
  const xThroughSB = centerX - 24;
  const xTurnLeftSB = centerX - 8;

  const xTurnLeftNB = centerX + 8;
  const xThroughNB = centerX + 24;
  const xTurnRightNB = centerX + 44;
  const xBikeNB = centerX + 64;
  const xWalkNB = centerX + 84;

  // Helper for straight through corridors
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
    const lengthMeters = (rightX - leftX) / PIXELS_PER_METER;
    lanes.push({
      id,
      name,
      type,
      direction: dir,
      orientation: 'horizontal',
      widthMeters: 3.2,
      renderHeightPx: type === 'sidewalk' ? 22 : type === 'bike' ? 18 : 22,
      yOffsetPx: y,
      length: lengthMeters,
      curve,
      vehicles: [],
      nextLanes: [],
      stopLine: stopDistEW,
      speedLimitKmh: speedLimit,
    });
  };

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
    const lengthMeters = (bottomY - topY) / PIXELS_PER_METER;
    lanes.push({
      id,
      name,
      type,
      direction: dir,
      orientation: 'vertical',
      widthMeters: 3.2,
      renderHeightPx: type === 'sidewalk' ? 22 : type === 'bike' ? 18 : 22,
      xOffsetPx: x,
      yOffsetPx: centerY,
      length: lengthMeters,
      curve,
      vehicles: [],
      nextLanes: [],
      stopLine: stopDistNS,
      speedLimitKmh: speedLimit,
    });
  };

  // --- 1. Through Corridors (All Visible Asphalt & Sidewalks) ---
  addStraightHorizontal('sidewalk_wb', 'North Sidewalk WB', 'sidewalk', yWalkWB, 'reverse', 5);
  addStraightHorizontal('bike_wb', 'Westbound Bike Lane', 'bike', yBikeWB, 'reverse', 20);
  addStraightHorizontal('travel_wb_1', 'Boulevard WB Through', 'motor', yThroughWB, 'reverse', 50);

  addStraightHorizontal('travel_eb_1', 'Boulevard EB Through', 'motor', yThroughEB, 'forward', 50);
  addStraightHorizontal('transit_eb', 'BRT Transit EB', 'transit', yTurnRightEB, 'forward', 45);
  addStraightHorizontal('bike_eb', 'Eastbound Bike Lane', 'bike', yBikeEB, 'forward', 20);
  addStraightHorizontal('sidewalk_eb', 'South Sidewalk EB', 'sidewalk', yWalkEB, 'forward', 5);

  addStraightVertical('ns_walk_sb', 'West Sidewalk SB', 'sidewalk', xWalkSB, 'forward', 5);
  addStraightVertical('ns_bike_sb', 'Southbound Bike Lane', 'bike', xBikeSB, 'forward', 20);
  addStraightVertical('ns_travel_sb', 'Avenue SB Through', 'motor', xThroughSB, 'forward', 45);

  addStraightVertical('ns_travel_nb', 'Avenue NB Through', 'motor', xThroughNB, 'reverse', 45);
  addStraightVertical('ns_bike_nb', 'Northbound Bike Lane', 'bike', xBikeNB, 'reverse', 20);
  addStraightVertical('ns_walk_nb', 'East Sidewalk NB', 'sidewalk', xWalkNB, 'reverse', 5);

  // --- 2. Piecewise Turn Pocket Lanes (100% Straight Approach -> 90-deg Junction Arc -> 100% Straight Departure) ---
  const addPiecewiseTurnLane = (
    id: string,
    name: string,
    type: 'turn_left' | 'turn_right' | 'sidewalk',
    dir: LaneDirection,
    appStart: { x: number; y: number },
    stopPt: { x: number; y: number },
    depStart: { x: number; y: number },
    depEnd: { x: number; y: number },
    turnCurve: CubicBezier,
    speedLimit: number,
  ) => {
    const appLenPx = Math.hypot(stopPt.x - appStart.x, stopPt.y - appStart.y);
    const turnLenPx = approximateBezierLength(turnCurve, 20);
    const depLenPx = Math.hypot(depEnd.x - depStart.x, depEnd.y - depStart.y);

    const appLenM = appLenPx / PIXELS_PER_METER;
    const turnLenM = turnLenPx / PIXELS_PER_METER;
    const depLenM = depLenPx / PIXELS_PER_METER;
    const totalLenM = appLenM + turnLenM + depLenM;

    const piecewise: PiecewisePath = {
      appStart,
      stopPt,
      depStart,
      depEnd,
      appLenM,
      turnLenM,
      depLenM,
      totalLenM,
      turnCurve,
    };

    lanes.push({
      id,
      name,
      type,
      direction: dir,
      orientation: 'turn',
      widthMeters: 3.2,
      renderHeightPx: type === 'sidewalk' ? 22 : 22,
      yOffsetPx: appStart.y,
      xOffsetPx: appStart.x,
      length: totalLenM,
      curve: turnCurve,
      piecewise,
      vehicles: [],
      nextLanes: [],
      stopLine: appLenM,
      speedLimitKmh: speedLimit,
    });
  };

  // 1. Eastbound Left Turn Pocket (EB -> NB)
  addPiecewiseTurnLane(
    'turn_left_eb',
    'Eastbound Left Turn Pocket',
    'turn_left',
    'forward',
    { x: leftX, y: yTurnLeftEB },
    { x: stopX_EB, y: yTurnLeftEB },
    { x: xThroughNB, y: stopY_SB },
    { x: xThroughNB, y: topY },
    {
      p0: { x: stopX_EB, y: yTurnLeftEB },
      p1: { x: centerX - 10, y: yTurnLeftEB },
      p2: { x: xThroughNB, y: centerY + 10 },
      p3: { x: xThroughNB, y: stopY_SB },
    },
    35,
  );

  // 2. Eastbound Right Turn Pocket (EB -> SB)
  addPiecewiseTurnLane(
    'turn_right_eb',
    'Eastbound Right Turn Pocket',
    'turn_right',
    'forward',
    { x: leftX, y: yTurnRightEB },
    { x: stopX_EB, y: yTurnRightEB },
    { x: xThroughSB, y: stopY_NB },
    { x: xThroughSB, y: bottomY },
    {
      p0: { x: stopX_EB, y: yTurnRightEB },
      p1: { x: stopX_EB + 30, y: yTurnRightEB },
      p2: { x: xThroughSB, y: stopY_NB - 30 },
      p3: { x: xThroughSB, y: stopY_NB },
    },
    30,
  );

  // 3. Westbound Left Turn Pocket (WB -> SB)
  addPiecewiseTurnLane(
    'turn_left_wb',
    'Westbound Left Turn Pocket',
    'turn_left',
    'reverse',
    { x: rightX, y: yTurnLeftWB },
    { x: stopX_WB, y: yTurnLeftWB },
    { x: xThroughSB, y: stopY_NB },
    { x: xThroughSB, y: bottomY },
    {
      p0: { x: stopX_WB, y: yTurnLeftWB },
      p1: { x: centerX + 10, y: yTurnLeftWB },
      p2: { x: xThroughSB, y: centerY - 10 },
      p3: { x: xThroughSB, y: stopY_NB },
    },
    35,
  );

  // 4. Westbound Right Turn Pocket (WB -> NB)
  addPiecewiseTurnLane(
    'turn_right_wb',
    'Westbound Right Turn Pocket',
    'turn_right',
    'reverse',
    { x: rightX, y: yTurnRightWB },
    { x: stopX_WB, y: yTurnRightWB },
    { x: xThroughNB, y: stopY_SB },
    { x: xThroughNB, y: topY },
    {
      p0: { x: stopX_WB, y: yTurnRightWB },
      p1: { x: stopX_WB - 30, y: yTurnRightWB },
      p2: { x: xThroughNB, y: stopY_SB + 30 },
      p3: { x: xThroughNB, y: stopY_SB },
    },
    30,
  );

  // 5. Southbound Left Turn Pocket (SB -> EB)
  addPiecewiseTurnLane(
    'turn_left_sb',
    'Southbound Left Turn Pocket',
    'turn_left',
    'forward',
    { x: xTurnLeftSB, y: topY },
    { x: xTurnLeftSB, y: stopY_SB },
    { x: stopX_WB, y: yThroughEB },
    { x: rightX, y: yThroughEB },
    {
      p0: { x: xTurnLeftSB, y: stopY_SB },
      p1: { x: xTurnLeftSB, y: centerY - 10 },
      p2: { x: centerX - 10, y: yThroughEB },
      p3: { x: stopX_WB, y: yThroughEB },
    },
    35,
  );

  // 6. Southbound Right Turn Pocket (SB -> WB)
  addPiecewiseTurnLane(
    'turn_right_sb',
    'Southbound Right Turn Pocket',
    'turn_right',
    'forward',
    { x: xTurnRightSB, y: topY },
    { x: xTurnRightSB, y: stopY_SB },
    { x: stopX_EB, y: yThroughWB },
    { x: leftX, y: yThroughWB },
    {
      p0: { x: xTurnRightSB, y: stopY_SB },
      p1: { x: xTurnRightSB, y: stopY_SB + 30 },
      p2: { x: stopX_EB + 30, y: yThroughWB },
      p3: { x: stopX_EB, y: yThroughWB },
    },
    30,
  );

  // 7. Northbound Left Turn Pocket (NB -> WB)
  addPiecewiseTurnLane(
    'turn_left_nb',
    'Northbound Left Turn Pocket',
    'turn_left',
    'reverse',
    { x: xTurnLeftNB, y: bottomY },
    { x: xTurnLeftNB, y: stopY_NB },
    { x: stopX_EB, y: yThroughWB },
    { x: leftX, y: yThroughWB },
    {
      p0: { x: xTurnLeftNB, y: stopY_NB },
      p1: { x: xTurnLeftNB, y: centerY + 10 },
      p2: { x: centerX + 10, y: yThroughWB },
      p3: { x: stopX_EB, y: yThroughWB },
    },
    35,
  );

  // 8. Northbound Right Turn Pocket (NB -> EB)
  addPiecewiseTurnLane(
    'turn_right_nb',
    'Northbound Right Turn Pocket',
    'turn_right',
    'reverse',
    { x: xTurnRightNB, y: bottomY },
    { x: xTurnRightNB, y: stopY_NB },
    { x: stopX_WB, y: yThroughEB },
    { x: rightX, y: yThroughEB },
    {
      p0: { x: xTurnRightNB, y: stopY_NB },
      p1: { x: xTurnRightNB, y: stopY_NB - 30 },
      p2: { x: stopX_WB - 30, y: yThroughEB },
      p3: { x: stopX_WB, y: yThroughEB },
    },
    30,
  );

  // --- 3. Pedestrian Crosswalk Movements (Walking strictly on sidewalks and crosswalks) ---
  // West Crosswalk (South Sidewalk -> North Sidewalk)
  addPiecewiseTurnLane(
    'walk_turn_w_n',
    'West Crosswalk Northbound',
    'sidewalk',
    'forward',
    { x: leftX, y: yWalkEB },
    { x: stopX_EB - 6, y: yWalkEB },
    { x: stopX_EB - 6, y: yWalkWB },
    { x: leftX, y: yWalkWB },
    {
      p0: { x: stopX_EB - 6, y: yWalkEB },
      p1: { x: stopX_EB - 6, y: centerY + 20 },
      p2: { x: stopX_EB - 6, y: centerY - 20 },
      p3: { x: stopX_EB - 6, y: yWalkWB },
    },
    5,
  );

  // West Crosswalk Southbound (North Sidewalk -> South Sidewalk)
  addPiecewiseTurnLane(
    'walk_turn_w_s',
    'West Crosswalk Southbound',
    'sidewalk',
    'forward',
    { x: leftX, y: yWalkWB },
    { x: stopX_EB - 6, y: yWalkWB },
    { x: xWalkSB, y: stopY_NB + 6 },
    { x: xWalkSB, y: bottomY },
    {
      p0: { x: stopX_EB - 6, y: yWalkWB },
      p1: { x: stopX_EB - 6, y: centerY },
      p2: { x: xWalkSB, y: centerY + 40 },
      p3: { x: xWalkSB, y: stopY_NB + 6 },
    },
    5,
  );

  // East Crosswalk (North Sidewalk -> South Sidewalk)
  addPiecewiseTurnLane(
    'walk_turn_e_s',
    'East Crosswalk Southbound',
    'sidewalk',
    'forward',
    { x: rightX, y: yWalkWB },
    { x: stopX_WB + 6, y: yWalkWB },
    { x: stopX_WB + 6, y: yWalkEB },
    { x: rightX, y: yWalkEB },
    {
      p0: { x: stopX_WB + 6, y: yWalkWB },
      p1: { x: stopX_WB + 6, y: centerY - 20 },
      p2: { x: stopX_WB + 6, y: centerY + 20 },
      p3: { x: stopX_WB + 6, y: yWalkEB },
    },
    5,
  );

  // East Crosswalk Northbound
  addPiecewiseTurnLane(
    'walk_turn_e_n',
    'East Crosswalk Northbound',
    'sidewalk',
    'forward',
    { x: rightX, y: yWalkEB },
    { x: stopX_WB + 6, y: yWalkEB },
    { x: xWalkNB, y: stopY_SB - 6 },
    { x: xWalkNB, y: topY },
    {
      p0: { x: stopX_WB + 6, y: yWalkEB },
      p1: { x: stopX_WB + 6, y: centerY },
      p2: { x: xWalkNB, y: centerY - 40 },
      p3: { x: xWalkNB, y: stopY_SB - 6 },
    },
    5,
  );

  // North Crosswalk (West Sidewalk -> East Sidewalk)
  addPiecewiseTurnLane(
    'walk_turn_n_e',
    'North Crosswalk Eastbound',
    'sidewalk',
    'forward',
    { x: xWalkSB, y: topY },
    { x: xWalkSB, y: stopY_SB - 6 },
    { x: xWalkNB, y: stopY_SB - 6 },
    { x: xWalkNB, y: topY },
    {
      p0: { x: xWalkSB, y: stopY_SB - 6 },
      p1: { x: centerX - 20, y: stopY_SB - 6 },
      p2: { x: centerX + 20, y: stopY_SB - 6 },
      p3: { x: xWalkNB, y: stopY_SB - 6 },
    },
    5,
  );

  addPiecewiseTurnLane(
    'walk_turn_n_w',
    'North Crosswalk Westbound',
    'sidewalk',
    'forward',
    { x: xWalkNB, y: topY },
    { x: xWalkNB, y: stopY_SB - 6 },
    { x: stopX_EB - 6, y: yWalkWB },
    { x: leftX, y: yWalkWB },
    {
      p0: { x: xWalkNB, y: stopY_SB - 6 },
      p1: { x: centerX, y: stopY_SB - 6 },
      p2: { x: stopX_EB - 6, y: centerY - 40 },
      p3: { x: stopX_EB - 6, y: yWalkWB },
    },
    5,
  );

  // South Crosswalk (East Sidewalk -> West Sidewalk)
  addPiecewiseTurnLane(
    'walk_turn_s_w',
    'South Crosswalk Westbound',
    'sidewalk',
    'forward',
    { x: xWalkNB, y: bottomY },
    { x: xWalkNB, y: stopY_NB + 6 },
    { x: xWalkSB, y: stopY_NB + 6 },
    { x: xWalkSB, y: bottomY },
    {
      p0: { x: xWalkNB, y: stopY_NB + 6 },
      p1: { x: centerX + 20, y: stopY_NB + 6 },
      p2: { x: centerX - 20, y: stopY_NB + 6 },
      p3: { x: xWalkSB, y: stopY_NB + 6 },
    },
    5,
  );

  addPiecewiseTurnLane(
    'walk_turn_s_e',
    'South Crosswalk Eastbound',
    'sidewalk',
    'forward',
    { x: xWalkSB, y: bottomY },
    { x: xWalkSB, y: stopY_NB + 6 },
    { x: stopX_WB + 6, y: yWalkEB },
    { x: rightX, y: yWalkEB },
    {
      p0: { x: xWalkSB, y: stopY_NB + 6 },
      p1: { x: centerX, y: stopY_NB + 6 },
      p2: { x: stopX_WB + 6, y: centerY + 40 },
      p3: { x: stopX_WB + 6, y: yWalkEB },
    },
    5,
  );

  return { lanes, totalWidth: worldW, totalHeight: worldH };
}
