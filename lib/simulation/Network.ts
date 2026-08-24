// Bézier Road Network & Lane Graph Builder

import { Vehicle } from './Vehicle';
import { LaneType, LaneDirection, StreetConfig } from '../types/street';
import { CubicBezier, evaluateBezierFull, approximateBezierLength } from './Curvature';

export { evaluateBezierFull, approximateBezierLength };
export type { CubicBezier };

export interface LaneSegment {
  id: string;
  name: string;
  type: LaneType;
  direction: LaneDirection;
  widthMeters: number;
  renderHeightPx: number;
  yOffsetPx: number;       // Center y position of this lane in pixels
  length: number;          // Longitudinal length in meters
  curve: CubicBezier;
  vehicles: Vehicle[];     // Current vehicles in lane
  nextLanes: string[];
  stopLine?: number;       // Stop-line position in meters (if present)
  speedLimitKmh: number;   // Base speed limit on this lane
}

export const PIXELS_PER_METER = 16;
export const CANVAS_MARGIN_X = 20;
export const CANVAS_MARGIN_Y = 20;

/**
 * Generate Bézier lane curves from StreetConfig cross-section
 */
export function buildNetworkFromConfig(config: StreetConfig, canvasWidth = 960): {
  lanes: LaneSegment[];
  totalHeight: number;
} {
  const lanes: LaneSegment[] = [];
  const roadLengthMeters = config.lengthMeters || 60;
  const curvature = config.curvatureIntensity ?? 0; // -1 to +1

  // Compute y offsets for each lane
  let currentY = CANVAS_MARGIN_Y;
  const laneLayouts: Array<{ lane: StreetConfig['lanes'][0]; yCenter: number; heightPx: number }> = [];

  for (const laneDef of config.lanes) {
    const heightPx = Math.max(24, Math.round(laneDef.width * PIXELS_PER_METER));
    const yCenter = currentY + heightPx / 2;
    laneLayouts.push({ lane: laneDef, yCenter, heightPx });
    currentY += heightPx + 2; // 2px separator
  }

  const totalHeight = currentY + CANVAS_MARGIN_Y;
  const leftX = CANVAS_MARGIN_X;
  const rightX = canvasWidth - CANVAS_MARGIN_X;
  const roadSpanX = rightX - leftX;

  for (const { lane, yCenter, heightPx } of laneLayouts) {
    // Generate Bézier control points based on direction and curvature
    const curveDeflection = curvature * 80; // px displacement for curve

    let p0 = { x: leftX, y: yCenter };
    let p1 = { x: leftX + roadSpanX / 3, y: yCenter + curveDeflection * 0.8 };
    let p2 = { x: leftX + (2 * roadSpanX) / 3, y: yCenter + curveDeflection * 0.8 };
    let p3 = { x: rightX, y: yCenter };

    if (lane.direction === 'reverse') {
      // Westbound/reverse direction: starts at rightX, goes to leftX
      p0 = { x: rightX, y: yCenter };
      p1 = { x: rightX - roadSpanX / 3, y: yCenter + curveDeflection * 0.8 };
      p2 = { x: leftX + roadSpanX / 3, y: yCenter + curveDeflection * 0.8 };
      p3 = { x: leftX, y: yCenter };
    }

    const curve: CubicBezier = { p0, p1, p2, p3 };
    const lengthPx = approximateBezierLength(curve, 24);
    const lengthMeters = lengthPx / PIXELS_PER_METER;

    lanes.push({
      id: lane.id,
      name: lane.name,
      type: lane.type,
      direction: lane.direction,
      widthMeters: lane.width,
      renderHeightPx: heightPx,
      yOffsetPx: yCenter,
      length: lengthMeters,
      curve,
      vehicles: [],
      nextLanes: [],
      stopLine: lane.stopLineMeters,
      speedLimitKmh: lane.speedLimitKmh || 50,
    });
  }

  return { lanes, totalHeight };
}
