
export interface Superellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
    n?: number;
    rot?: number;
}

const r2 = (v: number) => {
  const s = Math.round(v * 100) / 100;
  return Object.is(s, -0) ? "0" : String(s);
};

export function superellipse({ cx, cy, rx, ry, n = 4, rot = 0 }: Superellipse): string {
  const k = Math.min(1, (8 * Math.pow(2, -1 / n) - 4) / 3);
  const a = rx;
  const b = ry;
  const ak = a * k;
  const bk = b * k;

  const pts: [number, number][] = [
    [a, 0],
    [a, bk], [ak, b], [0, b],
    [-ak, b], [-a, bk], [-a, 0],
    [-a, -bk], [-ak, -b], [0, -b],
    [ak, -b], [a, -bk], [a, 0],
  ];

  const t = (rot * Math.PI) / 180;
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  const at = (i: number) => {
    const [x, y] = pts[i]!;
    return `${r2(cx + x * cos - y * sin)} ${r2(cy + x * sin + y * cos)}`;
  };

  let d = `M${at(0)}`;
  for (let i = 1; i < 13; i += 3) d += `C${at(i)} ${at(i + 1)} ${at(i + 2)}`;
  return d + "Z";
}

export function arc(cx: number, cy: number, w: number, depth: number): string {
  return `M${r2(cx - w)} ${r2(cy)}Q${r2(cx)} ${r2(cy + depth)} ${r2(cx + w)} ${r2(cy)}`;
}

export function blobPath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  radii: number[],
  rot = 0,
): string {
  const n = radii.length;
  const t0 = (rot * Math.PI) / 180;
  const p: [number, number][] = radii.map((m, i) => {
    const a = t0 + (2 * Math.PI * i) / n;
    return [cx + rx * m * Math.cos(a), cy + ry * m * Math.sin(a)];
  });

  const at = (i: number) => p[((i % n) + n) % n]!;
  let d = `M${r2(at(0)[0])} ${r2(at(0)[1])}`;

  for (let i = 0; i < n; i++) {
    const [x0, y0] = at(i - 1);
    const [x1, y1] = at(i);
    const [x2, y2] = at(i + 1);
    const [x3, y3] = at(i + 2);
    d +=
      `C${r2(x1 + (x2 - x0) / 6)} ${r2(y1 + (y2 - y0) / 6)}` +
      ` ${r2(x2 - (x3 - x1) / 6)} ${r2(y2 - (y3 - y1) / 6)}` +
      ` ${r2(x2)} ${r2(y2)}`;
  }

  return d + "Z";
}

export interface Polygon {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
    sides: number;
    round?: number;
    rot?: number;
}

export function polygon({ cx, cy, rx, ry, sides, round = 0.3, rot = 0 }: Polygon): string {
  const k = round > 0 ? (round < 1 ? round / 2 : 0.5) : 0;
  const t0 = (rot * Math.PI) / 180 - Math.PI / 2;
  const v: [number, number][] = Array.from({ length: sides }, (_, i) => {
    const a = t0 + (2 * Math.PI * i) / sides;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });

  const at = (i: number) => v[((i % sides) + sides) % sides]!;
    const cut = (i: number, j: number) => {
    const [x0, y0] = at(i);
    const [x1, y1] = at(j);
    return `${r2(x0 + (x1 - x0) * k)} ${r2(y0 + (y1 - y0) * k)}`;
  };

  let d = `M${cut(0, -1)}`;
  for (let i = 0; i < sides; i++) {
    const [x, y] = at(i);
    d += `Q${r2(x)} ${r2(y)} ${cut(i, i + 1)}`;
    if (k < 0.5) d += `L${cut(i + 1, i)}`;
  }
  return d + "Z";
}

export function box(cx: number, cy: number, rx: number, ry: number): string {
  const l = r2(cx - rx);
  const r = r2(cx + rx);
  return `M${l} ${r2(cy - ry)}H${r}V${r2(cy + ry)}H${l}Z`;
}

export function taper(cx: number, cy: number, rx: number, ry: number, tip: number): string {
  const t = Math.max(1.05, tip);
  const tx = rx * Math.sqrt(1 - 1 / (t * t));
  const ty = cy - ry / t;
  const apex = cy - t * ry;
  const px = tx * 0.14;
  const py = ty + 0.86 * (apex - ty);
  return (
    `M${r2(cx - tx)} ${r2(ty)}` +
    `L${r2(cx - px)} ${r2(py)}` +
    `Q${r2(cx)} ${r2(apex)} ${r2(cx + px)} ${r2(py)}` +
    `L${r2(cx + tx)} ${r2(ty)}Z`
  );
}
