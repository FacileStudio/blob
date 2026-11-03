
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

export type ColorKey = "bg" | "head" | "eye";
export type Palette = Partial<Record<ColorKey, string>>;

function toLinear({ l, c, h }: Oklch): [number, number, number] {
  const r = (h * Math.PI) / 180;
  const a = c * Math.cos(r);
  const b = c * Math.sin(r);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const L = l_ * l_ * l_;
  const M = m_ * m_ * m_;
  const S = s_ * s_ * s_;

  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

const inGamut = (rgb: number[]) =>
  rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

function resolve(color: Oklch): [number, number, number] {
  let rgb = toLinear(color);
  if (!inGamut(rgb)) {
    let lo = 0;
    let hi = color.c;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(toLinear({ ...color, c: mid }))) lo = mid;
      else hi = mid;
    }
    rgb = toLinear({ ...color, c: lo });
  }
  return rgb.map((v) => Math.min(1, Math.max(0, v))) as [
    number,
    number,
    number,
  ];
}

function luminance(color: Oklch): number {
  const [r, g, b] = resolve(color);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: Oklch, b: Oklch): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export function ensureContrast(fg: Oklch, bg: Oklch, min: number): Oklch {
  if (contrast(fg, bg) >= min) return fg;

  const lean = fg.l >= bg.l ? 1 : -1;
  for (const dir of [lean, -lean]) {
    const probe = { ...fg };
    for (let i = 0; i < 60; i++) {
      probe.l = Math.min(1, Math.max(0, probe.l + dir * 0.02));
      if (contrast(probe, bg) >= min) return probe;
      if (probe.l === 0 || probe.l === 1) break;
    }
  }

  const black = { ...fg, l: 0, c: 0 };
  const white = { ...fg, l: 1, c: 0 };
  return contrast(black, bg) >= contrast(white, bg) ? black : white;
}

export function toHex(color: Oklch): string {
  return (
    "#" +
    resolve(color)
      .map((v) => {
        const s =
          v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
        return Math.round(s * 255)
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
  );
}

export function fromHex(hex: string): Oklch {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }) as [number, number, number];

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    c: Math.hypot(A, B),
    h: (Math.atan2(B, A) * 180) / Math.PI,
  };
}

export function mix(a: Oklch, b: Oklch, t: number): Oklch {
  const rad = (v: number) => (v * Math.PI) / 180;
  const ax = a.c * Math.cos(rad(a.h));
  const ay = a.c * Math.sin(rad(a.h));
  const bx = b.c * Math.cos(rad(b.h));
  const by = b.c * Math.sin(rad(b.h));
  const x = ax + (bx - ax) * t;
  const y = ay + (by - ay) * t;
  return {
    l: a.l + (b.l - a.l) * t,
    c: Math.hypot(x, y),
    h: (Math.atan2(y, x) * 180) / Math.PI,
  };
}

export const mixHex = (a: string, b: string, t: number) =>
  toHex(mix(fromHex(a), fromHex(b), t));

export function fadeHex(a: string, b: string, t: number): string {
  let out = "#";
  for (let i = 1; i < 7; i += 2) {
    const from = parseInt(a.slice(i, i + 2), 16);
    const to = parseInt(b.slice(i, i + 2), 16);
    const v = Math.round(from + (to - from) * t);
    out += (v < 16 ? "0" : "") + v.toString(16);
  }
  return out;
}

export interface Tint {
    h: number;
    l: number;
    pull: number;
    c: number;
}

export const HOT: Tint = { h: 27, l: 0.58, pull: 0.6, c: 0.18 };

export const ROSE: Tint = { h: 358, l: 0.72, pull: 0.55, c: 0.16 };
export const BLUSH: Tint = { h: 12, l: 0.84, pull: 0.4, c: 0.1 };
export const BILE: Tint = { h: 142, l: 0.66, pull: 0.6, c: 0.13 };

export const TINTS: [string, Tint][] = [
  ["hot", HOT],
  ["rose", ROSE],
  ["blush", BLUSH],
  ["bile", BILE],
];

const TINT_FLOOR = 4.55;

export function tinted(
  head: string,
  eye: string,
  t: Tint,
): [string, string] {
  const base = fromHex(head);
  const baseEye = fromHex(eye);

  let hotHead: Oklch = {
    l: base.l + (t.l - base.l) * t.pull,
    c: Math.max(base.c, t.c),
    h: t.h,
  };
  hotHead = ensureContrast(hotHead, DARK_SURFACE, SURFACE_FLOOR);

  let hotEye = ensureContrast(baseEye, hotHead, TINT_FLOOR);

  const dir = hotEye.l >= hotHead.l ? 1 : -1;
  const headHex = toHex(hotHead);
  for (let pass = 0; pass < 40; pass++) {
    const eyeHex = toHex(hotEye);
    let worst = Infinity;
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      worst = Math.min(
        worst,
        contrast(
          fromHex(mixHex(eye, eyeHex, t)),
          fromHex(mixHex(head, headHex, t)),
        ),
      );
    }
    if (worst >= TINT_FLOOR) return [headHex, eyeHex];
    const l = Math.min(1, Math.max(0, hotEye.l + dir * 0.02));
    if (l === hotEye.l) return [headHex, eyeHex];
    hotEye = { ...hotEye, l };
  }

  return [headHex, toHex(hotEye)];
}

const TONES: [number, { l: number; c: number }][] = [
  [0.2, { l: 0.86, c: 0.085 }],
  [0.36, { l: 0.9, c: 0.028 }],
  [0.62, { l: 0.73, c: 0.135 }],
  [0.8, { l: 0.62, c: 0.165 }],
  [0.93, { l: 0.87, c: 0.16 }],
  [1.0, { l: 0.34, c: 0.035 }],
];

const toneAt = (v: number) =>
  TONES.find(([edge]) => v < edge)?.[1] ?? TONES[0]![1];

const DARK_SURFACE: Oklch = { l: 0.145, c: 0, h: 0 };
const SURFACE_FLOOR = 1.5;

const RAMP = (h: number, tone: number): Record<string, Oklch> => {
  const t = toneAt(tone);
  const head = ensureContrast({ l: t.l, c: t.c, h }, DARK_SURFACE, SURFACE_FLOOR);
  return {
    bg: { l: 0.965, c: 0.01, h },
    head,
    eye: head.l >= 0.5 ? { l: 0.17, c: 0.02, h } : { l: 0.97, c: 0.012, h },
  };
};

const FLOORS: [string, string, number][] = [
  ["head", "bg", 1.25],
  ["eye", "head", 4.5],
];

export { FLOORS };

function plate(color: string): Oklch | undefined {
  const hex = color.replace(/^#(\w)(\w)(\w)$/, "#$1$1$2$2$3$3");
  if (!/^#[\da-f]{6}$/i.test(hex)) return;
  let y = 0;
  [0.2126, 0.7152, 0.0722].map((w, i) => {
    const s = parseInt(hex.substr(1 + 2 * i, 2), 16) / 255;
    y += w * (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4);
  });
  return { l: Math.cbrt(y), c: 0, h: 0 };
}


export function ramp(
  hue: number,
  enforce = true,
  tone = 0,
  bg?: string,
): Record<string, Oklch> {
  const r = RAMP(hue, tone);
  const p = bg && plate(bg);
  if (p) r.bg = p;
  if (enforce) {
    for (const [fg, bg, min] of FLOORS) {
      r[fg] = ensureContrast(r[fg]!, r[bg]!, min);
    }
  }
  return r;
}

export function palette(
  hue: number,
  enforce = true,
  tone = 0,
  bg?: string,
): Palette {
  const r = ramp(hue, enforce, tone, bg);
  const out: Palette = {};
  for (const k in r) out[k as ColorKey] = toHex(r[k]!);
  if (bg) out.bg = bg;
  return out;
}
