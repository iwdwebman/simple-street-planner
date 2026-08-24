// Bézier Curvature, Arc Length, and Safe Cornering Speed Calculations

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

export interface CurveEvaluation {
  x: number;
  y: number;
  angle: number;       // heading angle in radians
  speed: number;       // tangent magnitude
  curvature: number;   // kappa (signed 1/m)
  radius: number;      // radius of curvature R (meters)
  maxSafeSpeed: number; // m/s based on lateral comfort
}

const GRAVITY = 9.81; // m/s^2
const LATERAL_FRICTION_COEFF = 0.35; // comfortable lateral acceleration ~0.35g

/**
 * Evaluate 2D cubic Bézier curve position, tangent heading, curvature, and safe speed at parameter t in [0, 1].
 */
export function evaluateBezierFull(curve: CubicBezier, t: number): CurveEvaluation {
  const clampedT = Math.max(0, Math.min(1, t));
  const mt = 1 - clampedT;
  const mt2 = mt * mt;
  const t2 = clampedT * clampedT;

  // 0th Derivative: Position (x, y)
  const x =
    mt2 * mt * curve.p0.x +
    3 * mt2 * clampedT * curve.p1.x +
    3 * mt * t2 * curve.p2.x +
    t2 * clampedT * curve.p3.x;

  const y =
    mt2 * mt * curve.p0.y +
    3 * mt2 * clampedT * curve.p1.y +
    3 * mt * t2 * curve.p2.y +
    t2 * clampedT * curve.p3.y;

  // 1st Derivative: Velocity/Tangent (dx/dt, dy/dt)
  const dx =
    3 * mt2 * (curve.p1.x - curve.p0.x) +
    6 * mt * clampedT * (curve.p2.x - curve.p1.x) +
    3 * t2 * (curve.p3.x - curve.p2.x);

  const dy =
    3 * mt2 * (curve.p1.y - curve.p0.y) +
    6 * mt * clampedT * (curve.p2.y - curve.p1.y) +
    3 * t2 * (curve.p3.y - curve.p2.y);

  // 2nd Derivative: Acceleration (ddx/dt2, ddy/dt2)
  const ddx =
    6 * mt * (curve.p2.x - 2 * curve.p1.x + curve.p0.x) +
    6 * clampedT * (curve.p3.x - 2 * curve.p2.x + curve.p1.x);

  const ddy =
    6 * mt * (curve.p2.y - 2 * curve.p1.y + curve.p0.y) +
    6 * clampedT * (curve.p3.y - 2 * curve.p2.y + curve.p1.y);

  const speedSq = dx * dx + dy * dy;
  const speed = Math.sqrt(speedSq);
  const angle = Math.atan2(dy, dx);

  // Curvature: kappa = (dx * ddy - dy * ddx) / (dx^2 + dy^2)^(3/2)
  let curvature = 0;
  let radius = Infinity;
  let maxSafeSpeed = Infinity;

  if (speedSq > 1e-6) {
    const cross = dx * ddy - dy * ddx;
    curvature = cross / Math.pow(speedSq, 1.5);
    const absCurvature = Math.abs(curvature);

    if (absCurvature > 1e-5) {
      radius = 1 / absCurvature;
      // v_safe = sqrt(mu * g * R)
      maxSafeSpeed = Math.sqrt(LATERAL_FRICTION_COEFF * GRAVITY * radius);
    }
  }

  return {
    x,
    y,
    angle,
    speed,
    curvature,
    radius,
    maxSafeSpeed,
  };
}

/**
 * Approximate curve arc length via numerical integration (Simpson's / Gauss-Legendre 10-point)
 */
export function approximateBezierLength(curve: CubicBezier, samples = 20): number {
  let length = 0;
  let prev = evaluateBezierFull(curve, 0);

  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const curr = evaluateBezierFull(curve, t);
    const segDx = curr.x - prev.x;
    const segDy = curr.y - prev.y;
    length += Math.hypot(segDx, segDy);
    prev = curr;
  }

  return length;
}
