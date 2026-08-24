// Draws static street geometry, lane markings, and signal indicators

import { LaneSegment, evaluateBezier } from '../simulation/Network';
import { TrafficSignal } from '../simulation/TrafficSignal';

const LANE_COLORS: Record<string, string> = {
  motor: '#374151',
  bike: '#D1FAE5',
  pedestrian: '#FEF3C7',
  transit: '#EDE9FE',
};

const LANE_BORDER: Record<string, string> = {
  motor: '#6B7280',
  bike: '#6EE7B7',
  pedestrian: '#FCD34D',
  transit: '#C4B5FD',
};

const LANE_HEIGHT = 60;

export function drawRoads(
  ctx: CanvasRenderingContext2D,
  lanes: LaneSegment[],
  signals: TrafficSignal[],
  canvasWidth: number,
): void {
  // Background
  ctx.fillStyle = '#1F2937';
  ctx.fillRect(0, 0, canvasWidth, lanes.length * LANE_HEIGHT + LANE_HEIGHT);

  for (const lane of lanes) {
    const p0 = lane.curve.p0;
    const p3 = lane.curve.p3;

    // Lane background band
    ctx.fillStyle = LANE_COLORS[lane.type] ?? '#374151';
    ctx.fillRect(
      Math.min(p0.x, p3.x),
      p0.y - LANE_HEIGHT / 2,
      Math.abs(p3.x - p0.x),
      LANE_HEIGHT,
    );

    // Lane border lines (top & bottom)
    ctx.strokeStyle = LANE_BORDER[lane.type] ?? '#6B7280';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.min(p0.x, p3.x), p0.y - LANE_HEIGHT / 2);
    ctx.lineTo(Math.max(p0.x, p3.x), p0.y - LANE_HEIGHT / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(Math.min(p0.x, p3.x), p0.y + LANE_HEIGHT / 2);
    ctx.lineTo(Math.max(p0.x, p3.x), p0.y + LANE_HEIGHT / 2);
    ctx.stroke();

    // Center dashed line for motor lanes
    if (lane.type === 'motor') {
      ctx.strokeStyle = '#9CA3AF';
      ctx.setLineDash([20, 15]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.min(p0.x, p3.x), p0.y);
      ctx.lineTo(Math.max(p0.x, p3.x), p0.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Lane label
    ctx.fillStyle = '#D1D5DB';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(lane.id, Math.min(p0.x, p3.x) + 4, p0.y + 4);

    // Stop line
    if (lane.stopLine !== undefined) {
      const t = lane.stopLine / lane.length;
      const pos = evaluateBezier(lane.curve, t);

      // Determine signal state
      let isGreen = true;
      for (const signal of signals) {
        const allControlled = new Set(signal.phases.flatMap((p) => p.greenLanes));
        if (allControlled.has(lane.id)) {
          isGreen = signal.isGreen(lane.id);
          break;
        }
      }

      ctx.strokeStyle = isGreen ? '#22C55E' : '#EF4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - LANE_HEIGHT / 2);
      ctx.lineTo(pos.x, pos.y + LANE_HEIGHT / 2);
      ctx.stroke();
    }
  }

  // Signal phase indicator (top-right corner)
  if (signals.length > 0) {
    const sig = signals[0];
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(canvasWidth - 160, 8, 152, 44);
    ctx.fillStyle = '#F9FAFB';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Signal: ${sig.currentPhase.name}`, canvasWidth - 154, 24);
    // Progress bar
    ctx.fillStyle = '#374151';
    ctx.fillRect(canvasWidth - 154, 30, 140, 10);
    ctx.fillStyle = sig.currentPhase.greenLanes.length > 0 ? '#22C55E' : '#EF4444';
    ctx.fillRect(canvasWidth - 154, 30, 140 * sig.phaseProgress, 10);
  }
}
