
import { motionSeeds, type IdleSeeds } from "./animate";
import { EASE_IN, EASE_IN_OUT, EASE_OUT } from "./ease";
import { poseTransforms, r3, type Posable, type Pose } from "./morph";
import { traits, type TraitOverrides } from "./traits";

export type { IdleSeeds };

export function idleSeeds(
  name: string,
  opts: { normalize?: boolean; traits?: TraitOverrides } = {},
): IdleSeeds {
  return motionSeeds(traits(name, opts.normalize ?? true, opts.traits));
}

export interface IdleFrame {
    shake: [number, number];
    breathe: [number, number];
    bob: number;
    saccade: [number, number];
    rockp: number;
    blink: number;
    wrap: { mx: number; side: number; sy: number; rot: number };
}

const cycle = (t: number, phase: number, period: number) => {
  const u = (t + phase) / period;
  return u - Math.floor(u);
};

const alternate = (t: number, phase: number, period: number) => {
  const u = (t + phase) / period;
  const n = Math.floor(u);
  const f = u - n;
  return n % 2 ? 1 - f : f;
};

function stops(
  u: number,
  table: readonly (readonly number[])[],
  col: number,
): number {
  for (let i = table.length - 1; i >= 0; i--) {
    const row = table[i]!;
    if (u < row[0]!) continue;
    const next = table[i + 1];
    if (!next) return row[col]!;
    const span = next[0]! - row[0]!;
    return span <= 0
      ? row[col]!
      : row[col]! + (next[col]! - row[col]!) * ((u - row[0]!) / span);
  }
  return table[0]![col]!;
}

const SACCADE: readonly (readonly number[])[] = [
  [0, 0, 0],
  [0.15, 0, 0],
  [0.165, -0.8, -0.9],
  [0.31, -0.8, -0.9],
  [0.325, 1, 0.1],
  [0.47, 1, 0.1],
  [0.485, -0.15, 0.85],
  [0.63, -0.15, 0.85],
  [0.645, 0.75, -0.8],
  [0.79, 0.75, -0.8],
  [0.805, -1, -0.15],
  [0.985, -1, -0.15],
  [1, 0, 0],
];

const WRAP: readonly (readonly number[])[] = [
  [0, 0, 0, 0, 0],
  [0.15, 0, 0, 0, 0],
  [0.165, -0.0176, 0.008, -0.027, 0.648],
  [0.31, -0.0176, 0.008, -0.027, 0.648],
  [0.325, -0.022, -0.01, -0.003, 0.09],
  [0.47, -0.022, -0.01, -0.003, 0.09],
  [0.485, -0.0033, 0.0015, -0.0255, -0.115],
  [0.63, -0.0033, 0.0015, -0.0255, -0.115],
  [0.645, -0.0165, -0.0075, -0.024, -0.54],
  [0.79, -0.0165, -0.0075, -0.024, -0.54],
  [0.805, -0.022, 0.01, -0.0045, 0.135],
  [0.985, -0.022, 0.01, -0.0045, 0.135],
  [1, 0, 0, 0, 0],
];

const SHAKE: readonly (readonly number[])[] = [
  [0, 0.62, -0.34],
  [0.25, -0.7, 0.22],
  [0.5, 0.38, 0.66],
  [0.75, -0.44, -0.6],
  [1, 0.62, -0.34],
];

const BREATHE_MS = 2800;
const BOB_MS = 3400;
const ROCK_MS = 900;
const SHAKE_MS = 112;

export function idleAt(
  s: IdleSeeds,
  t: number,
  amp: number,
  shake = 0,
): IdleFrame {
  const breathe = EASE_IN_OUT(alternate(t, s.phase, BREATHE_MS));
  const bob = EASE_IN_OUT(alternate(t, s.bob, BOB_MS));

  const sac = cycle(t, s.saccadePhase, s.saccade);
  const sh = cycle(t, 0, SHAKE_MS);

  const r = cycle(t, 0, ROCK_MS);
  const rockp = r < 0.5 ? 1 - 2 * EASE_IN_OUT(r * 2) : -1 + 2 * EASE_IN_OUT(r * 2 - 1);

  const b = cycle(t, s.blinkPhase, s.blink);
  const blink =
    b < 0.972
      ? 1
      : b < 0.986
        ? 1 - 0.92 * amp * EASE_IN((b - 0.972) / 0.014)
        : 1 - 0.92 * amp * (1 - EASE_OUT((b - 0.986) / 0.014));

  return {
    shake: [stops(sh, SHAKE, 1) * shake, stops(sh, SHAKE, 2) * shake],
    breathe: [1 + 0.022 * amp * breathe, 1 - 0.018 * amp * breathe],
    bob: -1.1 * amp * bob,
    saccade: [
      stops(sac, SACCADE, 1) * s.lookX * amp,
      stops(sac, SACCADE, 2) * s.lookY * amp,
    ],
    rockp,
    blink,
    wrap: {
      mx: stops(sac, WRAP, 1) * s.lookMX * amp,
      side: stops(sac, WRAP, 2) * s.lookX * amp,
      sy: stops(sac, WRAP, 3) * s.lookMY * amp,
      rot: stops(sac, WRAP, 4) * s.lookX * s.lookY * amp,
    },
  };
}

export function idleTransforms<L extends Posable>(
  l: L,
  p: Pose,
  f: IdleFrame,
): {
  root: string;
  breathe: string;
  bob: string;
  eyes: string;
  eye: string[];
  glance: string[];
} {
  return {
    root: `translate(${r3(f.shake[0])} ${r3(f.shake[1])})`,
    breathe: `translate(50 50) scale(${r3(f.breathe[0])} ${r3(f.breathe[1])}) translate(-50 -50)`,
    bob: `translate(0 ${r3(p.bdy + f.bob)})`,
    eyes: `translate(${r3(f.saccade[0])} ${r3(f.saccade[1])})`,
    eye: poseTransforms(l, p, f.rockp).eyes,
    glance: l.eyes.map((e, i) => {
      const side = i ? 1 : -1;
      const lean = e.rot;
      return (
        `translate(${r3(e.cx)} ${r3(e.cy)})` +
        ` rotate(${r3(f.wrap.rot * side)})` +
        ` scale(${r3(1 + f.wrap.mx + f.wrap.side * side)} ${r3(1 + f.wrap.sy)})` +
        ` rotate(${r3(lean)})` +
        ` scale(1 ${r3(f.blink)})` +
        ` rotate(${r3(-lean)})` +
        ` translate(${r3(-e.cx)} ${r3(-e.cy)})`
      );
    }),
  };
}
