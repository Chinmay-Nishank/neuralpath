export type LandscapeId = 'bowl' | 'saddle' | 'nonconvex' | 'rosenbrock';
export type OptimizerId = 'sgd' | 'momentum' | 'rmsprop' | 'adam';

export interface Point2D {
  x: number;
  y: number;
  loss: number;
}

export interface OptimizerRunState {
  id: OptimizerId;
  label: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  sx: number;
  sy: number;
  step: number;
  trail: Point2D[];
}

export function evalLoss(landscape: LandscapeId, x: number, y: number): number {
  switch (landscape) {
    case 'bowl':
      return 0.15 * x * x + 1.4 * y * y;
    case 'saddle':
      return 0.35 * (x * x - y * y) + 0.04 * (x * x + y * y) ** 2 + 1.2;
    case 'nonconvex':
      return (
        0.12 * (x * x + y * y) +
        0.9 * Math.sin(1.4 * x) * Math.cos(1.4 * y) +
        1.1
      );
    case 'rosenbrock':
      return 0.04 * ((1 - x) ** 2 + 12 * (y - x * x) ** 2);
  }
}

export function evalGrad(landscape: LandscapeId, x: number, y: number): [number, number] {
  const h = 1e-4;
  const gx = (evalLoss(landscape, x + h, y) - evalLoss(landscape, x - h, y)) / (2 * h);
  const gy = (evalLoss(landscape, x, y + h) - evalLoss(landscape, x, y - h)) / (2 * h);
  return [
    Math.max(-20, Math.min(20, gx)),
    Math.max(-20, Math.min(20, gy)),
  ];
}

export function startCoords(landscape: LandscapeId): [number, number] {
  switch (landscape) {
    case 'bowl':
      return [-2.2, 1.8];
    case 'saddle':
      return [-0.15, 2.0];
    case 'nonconvex':
      return [-2.3, 2.1];
    case 'rosenbrock':
      return [-1.5, 2.0];
  }
}

export function createInitialRuns(landscape: LandscapeId): OptimizerRunState[] {
  const [sx, sy] = startCoords(landscape);
  const initLoss = evalLoss(landscape, sx, sy);
  const defs: Array<{ id: OptimizerId; label: string; color: string }> = [
    { id: 'sgd', label: 'SGD', color: '#D55E00' },
    { id: 'momentum', label: 'Momentum', color: '#E69F00' },
    { id: 'rmsprop', label: 'RMSProp', color: '#009E73' },
    { id: 'adam', label: 'Adam', color: '#0072B2' },
  ];
  return defs.map((d) => ({
    ...d,
    x: sx,
    y: sy,
    vx: 0,
    vy: 0,
    sx: 0,
    sy: 0,
    step: 0,
    trail: [{ x: sx, y: sy, loss: initLoss }],
  }));
}

export function stepOptimizer(
  run: OptimizerRunState,
  landscape: LandscapeId,
  lr: number,
  beta1: number
): OptimizerRunState {
  const [gx, gy] = evalGrad(landscape, run.x, run.y);
  const t = run.step + 1;
  let nx = run.x;
  let ny = run.y;
  let vx = run.vx;
  let vy = run.vy;
  let sx = run.sx;
  let sy = run.sy;

  if (run.id === 'sgd') {
    nx -= lr * gx;
    ny -= lr * gy;
  } else if (run.id === 'momentum') {
    vx = beta1 * vx + (1 - beta1) * gx;
    vy = beta1 * vy + (1 - beta1) * gy;
    nx -= lr * 1.4 * vx;
    ny -= lr * 1.4 * vy;
  } else if (run.id === 'rmsprop') {
    const rho = 0.9;
    sx = rho * sx + (1 - rho) * gx * gx;
    sy = rho * sy + (1 - rho) * gy * gy;
    nx -= (lr * gx) / (Math.sqrt(sx) + 1e-6);
    ny -= (lr * gy) / (Math.sqrt(sy) + 1e-6);
  } else {
    const b1 = beta1;
    const b2 = 0.999;
    vx = b1 * vx + (1 - b1) * gx;
    vy = b1 * vy + (1 - b1) * gy;
    sx = b2 * sx + (1 - b2) * gx * gx;
    sy = b2 * sy + (1 - b2) * gy * gy;
    const vxh = vx / (1 - b1 ** t);
    const vyh = vy / (1 - b1 ** t);
    const sxh = sx / (1 - b2 ** t);
    const syh = sy / (1 - b2 ** t);
    nx -= (lr * 1.2 * vxh) / (Math.sqrt(sxh) + 1e-6);
    ny -= (lr * 1.2 * vyh) / (Math.sqrt(syh) + 1e-6);
  }

  nx = Math.max(-2.8, Math.min(2.8, nx));
  ny = Math.max(-2.8, Math.min(2.8, ny));
  const loss = evalLoss(landscape, nx, ny);
  return {
    ...run,
    x: nx,
    y: ny,
    vx,
    vy,
    sx,
    sy,
    step: t,
    trail: [...run.trail.slice(-79), { x: nx, y: ny, loss }],
  };
}

