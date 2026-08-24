// 2D cubic Bézier helpers and lane graph

import { Vehicle, VehicleType } from './Vehicle';

export interface Vec2 {
  x: number;
  y: number;
}

export interface CubicBezier {
  p0: Vec2;
  p1: Vec2;
  p2: Vec2;
  p3: Vec2;
}

export function evaluateBezier(
  curve: CubicBezier,
  t: number,
): { x: number; y: number; angle: number } {
  const mt = 1 - t;
  const x =
    mt * mt * mt * curve.p0.x +
    3 * mt * mt * t * curve.p1.x +
    3 * mt * t * t * curve.p2.x +
    t * t * t * curve.p3.x;
  const y =
    mt * mt * mt * curve.p0.y +
    3 * mt * mt * t * curve.p1.y +
    3 * mt * t * t * curve.p2.y +
    t * t * t * curve.p3.y;

  // Tangent (derivative) for angle
  const dx =
    3 * mt * mt * (curve.p1.x - curve.p0.x) +
    6 * mt * t * (curve.p2.x - curve.p1.x) +
    3 * t * t * (curve.p3.x - curve.p2.x);
  const dy =
    3 * mt * mt * (curve.p1.y - curve.p0.y) +
    6 * mt * t * (curve.p2.y - curve.p1.y) +
    3 * t * t * (curve.p3.y - curve.p2.y);

  return { x, y, angle: Math.atan2(dy, dx) };
}

export type LaneType = 'motor' | 'bike' | 'pedestrian' | 'transit';

export interface LaneSegment {
  id: string;
  type: LaneType;
  length: number;
  curve: CubicBezier;
  vehicles: Vehicle[]; // sorted descending by s
  nextLanes: string[];
  /** Stop-line position (meters). Vehicles stop here when signal is red. Undefined = no stop line. */
  stopLine?: number;
}

export interface SpawnProfile {
  laneId: string;
  vehicleType: VehicleType;
  /** Vehicles per second */
  rate: number;
  /** Accumulated inter-arrival time */
  _accumulator: number;
}

// -----------------------------------------------------------------------
// Default cross-section geometry
// Street width: 800 px canvas, 10 lanes rendered top-to-bottom
// Each lane is a straight horizontal segment of 800 px (≈ 800 m scaled)
// -----------------------------------------------------------------------
const LANE_HEIGHT = 60; // px per lane
const CANVAS_W = 900;
const LANE_MARGIN = 10;

function straightLane(y: number, length: number): CubicBezier {
  const margin = LANE_MARGIN;
  return {
    p0: { x: margin, y },
    p1: { x: margin + length / 3, y },
    p2: { x: margin + (2 * length) / 3, y },
    p3: { x: margin + length, y },
  };
}

export function buildDefaultNetwork(): LaneSegment[] {
  const len = CANVAS_W - 2 * LANE_MARGIN;
  const lanes: LaneSegment[] = [
    // Eastbound lanes (top → bottom, moving left-to-right)
    {
      id: 'sidewalk_eb',
      type: 'pedestrian',
      length: len,
      curve: straightLane(LANE_HEIGHT * 0.5, len),
      vehicles: [],
      nextLanes: [],
    },
    {
      id: 'bike_eb',
      type: 'bike',
      length: len,
      curve: straightLane(LANE_HEIGHT * 1.5, len),
      vehicles: [],
      nextLanes: [],
    },
    {
      id: 'travel_lane_1',
      type: 'motor',
      length: len,
      curve: straightLane(LANE_HEIGHT * 2.5, len),
      vehicles: [],
      nextLanes: [],
      stopLine: len * 0.85,
    },
    {
      id: 'travel_lane_2',
      type: 'motor',
      length: len,
      curve: straightLane(LANE_HEIGHT * 3.5, len),
      vehicles: [],
      nextLanes: [],
      stopLine: len * 0.85,
    },
    // Center turn / transit median
    {
      id: 'center_turn_lane',
      type: 'transit',
      length: len,
      curve: straightLane(LANE_HEIGHT * 4.5, len),
      vehicles: [],
      nextLanes: [],
    },
    // Westbound lanes (moving right-to-left, inverted Bézier)
    {
      id: 'travel_lane_wb_1',
      type: 'motor',
      length: len,
      curve: {
        p0: { x: CANVAS_W - LANE_MARGIN, y: LANE_HEIGHT * 5.5 },
        p1: { x: CANVAS_W - LANE_MARGIN - len / 3, y: LANE_HEIGHT * 5.5 },
        p2: { x: LANE_MARGIN + len / 3, y: LANE_HEIGHT * 5.5 },
        p3: { x: LANE_MARGIN, y: LANE_HEIGHT * 5.5 },
      },
      vehicles: [],
      nextLanes: [],
      stopLine: len * 0.85,
    },
    {
      id: 'travel_lane_wb_2',
      type: 'motor',
      length: len,
      curve: {
        p0: { x: CANVAS_W - LANE_MARGIN, y: LANE_HEIGHT * 6.5 },
        p1: { x: CANVAS_W - LANE_MARGIN - len / 3, y: LANE_HEIGHT * 6.5 },
        p2: { x: LANE_MARGIN + len / 3, y: LANE_HEIGHT * 6.5 },
        p3: { x: LANE_MARGIN, y: LANE_HEIGHT * 6.5 },
      },
      vehicles: [],
      nextLanes: [],
      stopLine: len * 0.85,
    },
    {
      id: 'bike_wb',
      type: 'bike',
      length: len,
      curve: {
        p0: { x: CANVAS_W - LANE_MARGIN, y: LANE_HEIGHT * 7.5 },
        p1: { x: CANVAS_W - LANE_MARGIN - len / 3, y: LANE_HEIGHT * 7.5 },
        p2: { x: LANE_MARGIN + len / 3, y: LANE_HEIGHT * 7.5 },
        p3: { x: LANE_MARGIN, y: LANE_HEIGHT * 7.5 },
      },
      vehicles: [],
      nextLanes: [],
    },
    {
      id: 'sidewalk_wb',
      type: 'pedestrian',
      length: len,
      curve: {
        p0: { x: CANVAS_W - LANE_MARGIN, y: LANE_HEIGHT * 8.5 },
        p1: { x: CANVAS_W - LANE_MARGIN - len / 3, y: LANE_HEIGHT * 8.5 },
        p2: { x: LANE_MARGIN + len / 3, y: LANE_HEIGHT * 8.5 },
        p3: { x: LANE_MARGIN, y: LANE_HEIGHT * 8.5 },
      },
      vehicles: [],
      nextLanes: [],
    },
  ];
  return lanes;
}

export const CANVAS_HEIGHT = LANE_HEIGHT * 10;
export const CANVAS_WIDTH = CANVAS_W;
