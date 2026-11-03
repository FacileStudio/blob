
export function bezier(
  [x1, y1, x2, y2]: readonly [number, number, number, number],
): (x: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  return (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = ((ax * t + bx) * t + cx) * t - x;
      if (Math.abs(err) < 1e-5) break;
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    return ((ay * t + by) * t + cy) * t;
  };
}

export const EASE_IN_OUT =  bezier([0.42, 0, 0.58, 1]);
export const EASE_IN =  bezier([0.42, 0, 1, 1]);
export const EASE_OUT =  bezier([0, 0, 0.58, 1]);

export const MORPH_IN = { ms: 300, ease:  bezier([0.45, 0.05, 0.5, 1]) };
export const MORPH_OUT = { ms: 400, ease: EASE_IN_OUT };
