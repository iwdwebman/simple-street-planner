// High-Precision Piecewise Analytical Geometry & Intersection Turning Dynamics

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
export const INTERSECTION_RADIUS = 100; // px half-size of crossroads junction box

/**
 * Piecewise path evaluator that guarantees 100% straight parallel approach,
 * tight 90-degree turn ONLY inside the intersection core, and straight departure.
 */
export interface CompositeTurnPath {
  approachStart: { x: number; y: number };
  stopPoint: { x: number; y: number };
  departureStart: { x: number; y: number };
  departureEnd: { x: number; y: number };
  approachLengthM: number;
  turnLengthM: number;
  departureLengthM: number;
  totalLengthM: number;
  type: 'left' | 'right' | 'through' | 'crosswalk';
}

/**
 * Evaluate point and angle along a piecewise composite lane path
 */
export function evaluateCompositePath(
  path: CompositeTurnPath,
  sMeters: number,
): { x: number; y: number; angle: number } {
  const s = Math.max(0, Math.min(path.totalLengthM, sMeters));
  const sApp = path.approachLengthM;
  const sTurn = path.turnLengthM;

  // 1. Approach Stage: 100% Straight Parallel Line
  if (s <= sApp) {
    const t = sApp > 0 ? s / sApp : 0;
    const x = path.approachStart.x + (path.stopPoint.x - path.approachStart.x) * t;
    const y = path.approachStart.y + (path.stopPoint.y - path.approachStart.y) * t;
    const angle = Math.atan2(path.stopPoint.y - path.approachStart.y, path.stopPoint.x - path.approachStart.x);
    return { x, y, angle };
  }

  // 2. Departure Stage: 100% Straight Parallel Line
  if (s >= sApp + sTurn) {
    const sDep = s - (sApp + sTurn);
    const t = path.departureLengthM > 0 ? sDep / path.departureLengthM : 1;
    const x = path.departureStart.x + (path.departureEnd.x - path.departureStart.x) * t;
    const y = path.departureStart.y + (path.departureEnd.y - path.departureStart.y) * t;
    const angle = Math.atan2(path.departureEnd.y - path.departureStart.y, path.departureEnd.x - path.departureStart.x);
    return { x, y, angle };
  }

  // 3. Intersection Turn Stage: Smooth 90-degree corner arc inside intersection core ONLY
  const tTurn = sTurn > 0 ? (s - sApp) / sTurn : 0;
  // Cubic Bézier inside intersection box: P0 = stopPoint, P3 = departureStart
  const dx = path.departureStart.x - path.stopPoint.x;
  const dy = path.departureStart.y - path.stopPoint.y;

  const p0 = path.stopPoint;
  const p3 = path.departureStart;
  const p1 = { x: p0.x + (path.type === 'left' ? dx * 0.6 : dx * 0.4), y: p0.y + (path.type === 'left' ? dy * 0.1 : dy * 0.1) };
  const p2 = { x: p0.x + (path.type === 'left' ? dx * 0.9 : dx * 0.9), y: p0.y + (path.type === 'left' ? dy * 0.4 : dy * 0.6) };

  const bezCurve: CubicBezier = { p0, p1, p2, p3 };
  const pt = evaluateBezierFull(bezCurve, tTurn);
  return { x: pt.x, y: pt.y, angle: pt.angle };
}

/**
 * Build 5x Multi-Corridor Road Network with Clean Geometry
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

  // Stop line coordinates
  const stopX_EB = centerX - R;
  const stopX_WB = centerX + R;
  const stopY_SB = centerY - R;
  const stopY_NB = centerY + R;

  const stopDistEW = (centerX - R - leftX) / PIXELS_PER_METER;
  const stopDistNS = (centerY - R - topY) / PIXELS_PER_METER;

  // --- Right-Hand Traffic (RHT) Street Cross-Section Layout ---
  // East-West Corridor (Total width ~180px):
  // North half (Westbound, y < centerY):
  //   - North Sidewalk: centerY - 80
  //   - WB Bike Lane: centerY - 58
  //   - WB Right Turn Bay: centerY - 40
  //   - WB Through Lane: centerY - 22
  //   - WB Left Turn Bay: centerY - 7
  // Center Median: centerY ± 4
  // South half (Eastbound, y > centerY):
  //   - EB Left Turn Bay: centerY + 7
  //   - EB Through Lane: centerY + 22
  //   - EB Right Turn Bay / Transit: centerY + 40
  //   - EB Bike Lane: centerY + 58
  //   - South Sidewalk: centerY + 80

  const yWalkWB = centerY - 80;
  const yBikeWB = centerY - 58;
  const yTurnRightWB = centerY - 40;
  const yThroughWB = centerY - 22;
  const yTurnLeftWB = centerY - 7;

  const yTurnLeftEB = centerY + 7;
  const yThroughEB = centerY + 22;
  const yTurnRightEB = centerY + 40;
  const yBikeEB = centerY + 58;
  const yWalkEB = centerY + 80;

  // North-South Corridor (Total width ~180px):
  // West half (Southbound, x < centerX):
  //   - West Sidewalk: centerX - 80
  //   - SB Bike Lane: centerX - 58
  //   - SB Right Turn Bay: centerX - 40
  //   - SB Through Lane: centerX - 22
  //   - SB Left Turn Bay: centerX - 7
  // Center Median: centerX ± 4
  // East half (Northbound, x > centerX):
  //   - NB Left Turn Bay: centerX + 7
  //   - NB Through Lane: centerX + 22
  //   - NB Right Turn Bay: centerX + 40
  //   - NB Bike Lane: centerX + 58
  //   - East Sidewalk: centerX + 80

  const xWalkSB = centerX - 80;
  const xBikeSB = centerX - 58;
  const xTurnRightSB = centerX - 40;
  const xThroughSB = centerX - 22;
  const xTurnLeftSB = centerX - 7;

  const xTurnLeftNB = centerX + 7;
  const xThroughNB = centerX + 22;
  const xTurnRightNB = centerX + 40;
  const xBikeNB = centerX + 58;
  const xWalkNB = centerX + 80;

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
      renderHeightPx: type === 'sidewalk' ? 24 : type === 'bike' ? 20 : 26,
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
      renderHeightPx: type === 'sidewalk' ? 24 : type === 'bike' ? 20 : 26,
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

  // --- 1. Through Corridors ---
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

  // --- 2. Dedicated Turning Pocket Lanes (Strict Approach + Junction 90-deg Turn) ---
  // Helper to build a clean 4-point Bézier for turn pockets
  const addTurnPocketLane = (
    id: string,
    name: string,
    type: 'turn_left' | 'turn_right',
    dir: LaneDirection,
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    stopLine: number,
  ) => {
    const curve: CubicBezier = { p0, p1, p2, p3 };
    const lengthMeters = approximateBezierLength(curve, 32) / PIXELS_PER_METER;
    lanes.push({
      id,
      name,
      type,
      direction: dir,
      orientation: 'turn',
      widthMeters: 3.2,
      renderHeightPx: 26,
      yOffsetPx: p0.y,
      length: lengthMeters,
      curve,
      vehicles: [],
      nextLanes: [],
      stopLine,
      speedLimitKmh: type === 'turn_left' ? 35 : 30,
    });
  };

  // EB Left Turn (EB -> NB): Runs along y = yTurnLeftEB until stopX_EB, then turns North into xThroughNB
  addTurnPocketLane(
    'turn_left_eb',
    'Eastbound Left Turn Pocket',
    'turn_left',
    'forward',
    { x: leftX, y: yTurnLeftEB },
    { x: stopX_EB + 40, y: yTurnLeftEB },
    { x: xThroughNB, y: stopY_SB + 40 },
    { x: xThroughNB, y: topY },
    stopDistEW,
  );

  // EB Right Turn (EB -> SB): Runs along y = yTurnRightEB until stopX_EB, then turns South into xThroughSB
  addTurnPocketLane(
    'turn_right_eb',
    'Eastbound Right Turn Pocket',
    'turn_right',
    'forward',
    { x: leftX, y: yTurnRightEB },
    { x: stopX_EB, y: yTurnRightEB },
    { x: xThroughSB, y: stopY_NB - 30 },
    { x: xThroughSB, y: bottomY },
    stopDistEW,
  );

  // WB Left Turn (WB -> SB): Runs along y = yTurnLeftWB until stopX_WB, then turns South into xThroughSB
  addTurnPocketLane(
    'turn_left_wb',
    'Westbound Left Turn Pocket',
    'turn_left',
    'reverse',
    { x: rightX, y: yTurnLeftWB },
    { x: stopX_WB - 40, y: yTurnLeftWB },
    { x: xThroughSB, y: stopY_NB - 40 },
    { x: xThroughSB, y: bottomY },
    stopDistEW,
  );

  // WB Right Turn (WB -> NB): Runs along y = yTurnRightWB until stopX_WB, then turns North into xThroughNB
  addTurnPocketLane(
    'turn_right_wb',
    'Westbound Right Turn Pocket',
    'turn_right',
    'reverse',
    { x: rightX, y: yTurnRightWB },
    { x: stopX_WB, y: yTurnRightWB },
    { x: xThroughNB, y: stopY_SB + 30 },
    { x: xThroughNB, y: topY },
    stopDistEW,
  );

  // SB Left Turn (SB -> EB): Runs along x = xTurnLeftSB until stopY_SB, then turns East into yThroughEB
  addTurnPocketLane(
    'turn_left_sb',
    'Southbound Left Turn Pocket',
    'turn_left',
    'forward',
    { x: xTurnLeftSB, y: topY },
    { x: xTurnLeftSB, y: stopY_SB + 40 },
    { x: stopX_EB + 40, y: yThroughEB },
    { x: rightX, y: yThroughEB },
    stopDistNS,
  );

  // SB Right Turn (SB -> WB): Runs along x = xTurnRightSB until stopY_SB, then turns West into yThroughWB
  addTurnPocketLane(
    'turn_right_sb',
    'Southbound Right Turn Pocket',
    'turn_right',
    'forward',
    { x: xTurnRightSB, y: topY },
    { x: xTurnRightSB, y: stopY_SB },
    { x: stopX_WB - 30, y: yThroughWB },
    { x: leftX, y: yThroughWB },
    stopDistNS,
  );

  // NB Left Turn (NB -> WB): Runs along x = xTurnLeftNB until stopY_NB, then turns West into yThroughWB
  addTurnPocketLane(
    'turn_left_nb',
    'Northbound Left Turn Pocket',
    'turn_left',
    'reverse',
    { x: xTurnLeftNB, y: bottomY },
    { x: xTurnLeftNB, y: stopY_NB - 40 },
    { x: stopX_WB - 40, y: yThroughWB },
    { x: leftX, y: yThroughWB },
    stopDistNS,
  );

  // NB Right Turn (NB -> EB): Runs along x = xTurnRightNB until stopY_NB, then turns East into yThroughEB
  addTurnPocketLane(
    'turn_right_nb',
    'Northbound Right Turn Pocket',
    'turn_right',
    'reverse',
    { x: xTurnRightNB, y: bottomY },
    { x: xTurnRightNB, y: stopY_NB },
    { x: stopX_EB + 30, y: yThroughEB },
    { x: rightX, y: yThroughEB },
    stopDistNS,
  );

  // --- 3. Pedestrian Crosswalk Connectors (Strict Crosswalk Geometry) ---
  const addPedCrosswalk = (
    id: string,
    name: string,
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    stopLine: number,
  ) => {
    const curve: CubicBezier = { p0, p1, p2, p3 };
    const lengthMeters = approximateBezierLength(curve, 28) / PIXELS_PER_METER;
    lanes.push({
      id,
      name,
      type: 'sidewalk',
      direction: 'forward',
      orientation: 'turn',
      widthMeters: 2.6,
      renderHeightPx: 24,
      yOffsetPx: p0.y,
      length: lengthMeters,
      curve,
      vehicles: [],
      nextLanes: [],
      stopLine,
      speedLimitKmh: 5,
    });
  };

  // West Crosswalk (South Sidewalk -> North Sidewalk along West crosswalk at x = stopX_EB - 6)
  addPedCrosswalk(
    'walk_turn_w_n',
    'West Crosswalk Northbound',
    { x: leftX, y: yWalkEB },
    { x: stopX_EB - 6, y: yWalkEB },
    { x: stopX_EB - 6, y: yWalkWB },
    { x: leftX, y: yWalkWB },
    stopDistEW,
  );
  // West Crosswalk Southbound (North Sidewalk -> South Sidewalk)
  addPedCrosswalk(
    'walk_turn_w_s',
    'West Crosswalk Southbound',
    { x: leftX, y: yWalkWB },
    { x: stopX_EB - 6, y: yWalkWB },
    { x: xWalkSB, y: stopY_NB + 6 },
    { x: xWalkSB, y: bottomY },
    stopDistEW,
  );

  // East Crosswalk (North Sidewalk -> South Sidewalk along East crosswalk at x = stopX_WB + 6)
  addPedCrosswalk(
    'walk_turn_e_s',
    'East Crosswalk Southbound',
    { x: rightX, y: yWalkWB },
    { x: stopX_WB + 6, y: yWalkWB },
    { x: stopX_WB + 6, y: yWalkEB },
    { x: rightX, y: yWalkEB },
    stopDistEW,
  );
  // East Crosswalk Northbound
  addPedCrosswalk(
    'walk_turn_e_n',
    'East Crosswalk Northbound',
    { x: rightX, y: yWalkEB },
    { x: stopX_WB + 6, y: yWalkEB },
    { x: xWalkNB, y: stopY_SB - 6 },
    { x: xWalkNB, y: topY },
    stopDistEW,
  );

  // North Crosswalk (West Sidewalk -> East Sidewalk along North crosswalk at y = stopY_SB - 6)
  addPedCrosswalk(
    'walk_turn_n_e',
    'North Crosswalk Eastbound',
    { x: xWalkSB, y: topY },
    { x: xWalkSB, y: stopY_SB - 6 },
    { x: xWalkNB, y: stopY_SB - 6 },
    { x: xWalkNB, y: topY },
    stopDistNS,
  );
  addPedCrosswalk(
    'walk_turn_n_w',
    'North Crosswalk Westbound',
    { x: xWalkNB, y: topY },
    { x: xWalkNB, y: stopY_SB - 6 },
    { x: stopX_EB - 6, y: yWalkWB },
    { x: leftX, y: yWalkWB },
    stopDistNS,
  );

  // South Crosswalk (East Sidewalk -> West Sidewalk along South crosswalk at y = stopY_NB + 6)
  addPedCrosswalk(
    'walk_turn_s_w',
    'South Crosswalk Westbound',
    { x: xWalkNB, y: bottomY },
    { x: xWalkNB, y: stopY_NB + 6 },
    { x: xWalkSB, y: stopY_NB + 6 },
    { x: xWalkSB, y: bottomY },
    stopDistNS,
  );
  addPedCrosswalk(
    'walk_turn_s_e',
    'South Crosswalk Eastbound',
    { x: xWalkSB, y: bottomY },
    { x: xWalkSB, y: stopY_NB + 6 },
    { x: stopX_WB + 6, y: yWalkEB },
    { x: rightX, y: yWalkEB },
    stopDistNS,
  );

  return { lanes, totalWidth: worldW, totalHeight: worldH };
}
