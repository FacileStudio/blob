
import {
  BILE,
  BLUSH,
  HOT,
  ROSE,
  mixHex,
  tinted,
  type Palette,
  type Tint,
} from "./color";
import { IDENT, bakePose, r3, type Pose, type Posable } from "./morph";

export { bakePose, type Pose, type Posable };

export interface Expression {
  readonly p: Pose;
  readonly vars: (p: Pose) => Record<string, string>;
  readonly bake: <L extends Posable>(l: L, p: Pose) => { l: L; wrap: string };
    readonly tint?: (pal: Palette, p: Pose) => Palette;
}

export function poseVars(p: Pose): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k in IDENT) {
    if (k === "heat") continue;
    const v = p[k as keyof Pose];
    if (v !== IDENT[k as keyof Pose]) out["--mo-" + k] = r3(v);
  }
  return out;
}

export function tintWith(pal: Palette, p: Pose, t: Tint): Palette {
  const [head, eye] = tinted(pal.head!, pal.eye!, t);
  return {
    ...pal,
    head: mixHex(pal.head!, head, p.heat),
    eye: mixHex(pal.eye!, eye, p.heat),
  };
}

export const heatTint = (pal: Palette, p: Pose) => tintWith(pal, p, HOT);

export const idle: Expression = { p: IDENT, vars: poseVars, bake: bakePose };

export const happy: Expression = {
  p: {
    esx: 1.72,
    esy: 0.3,
    tilt: 8,
    edy: -1.5,
    edx: 1.5,
    esx2: 0.08,
    esy2: 0.05,
    tilt2: -16,
    edy2: 0,
    lock: 1,
    heat: 0,
    shake: 0,
    rock: 0,
    bdy: -2.2,
  },
  vars: poseVars,
  bake: bakePose,
};

export const sad: Expression = {
  p: {
    esx: 0.6,
    esy: 0.56,
    tilt: 26,
    edy: 3.6,
    edx: 1.9,
    esx2: -0.05,
    esy2: -0.07,
    tilt2: -7,
    edy2: 0,
    lock: 1,
    heat: 0,
    shake: 0,
    rock: 0,
    bdy: 2.6,
  },
  vars: poseVars,
  bake: bakePose,
};

export const mad: Expression = {
  p: {
    esx: 1.85,
    esy: 0.26,
    tilt: -33,
    edy: 0.4,
    edx: 0.6,
    esx2: 0,
    esy2: -0.03,
    tilt2: 5,
    edy2: 0,
    lock: 1,
    heat: 0.62,
    shake: 0.55,
    rock: 0,
    bdy: 0.8,
  },
  vars: poseVars,
  bake: bakePose,
  tint: heatTint,
};


export const surprised: Expression = {
  p: {
    esx: 1.34,
    esy: 1.2,
    tilt: -6,
    edy: -1.05,
    edx: 0.5,
    esx2: 0.05,
    esy2: 0.07,
    tilt2: 3,
    edy2: 0,
    lock: 1,
    heat: 0,
    shake: 0,
    rock: 0,
    bdy: -1.4,
  },
  vars: poseVars,
  bake: bakePose,
};

export const wink: Expression = {
  p: {
    esx: 1.32,
    esy: 0.76,
    tilt: 5,
    edy: -0.6,
    edx: 0.8,
    esx2: 0.26,
    esy2: -0.56,
    tilt2: -11,
    edy2: 0,
    lock: 1,
    heat: 0,
    shake: 0,
    rock: 0,
    bdy: -1.1,
  },
  vars: poseVars,
  bake: bakePose,
};

export const sleepy: Expression = {
  p: {
    esx: 1.14,
    esy: 0.22,
    tilt: 0,
    edy: 2.4,
    edx: 0.3,
    esx2: -0.04,
    esy2: 0.03,
    tilt2: 4,
    edy2: 0,
    lock: 1,
    heat: 0,
    shake: 0,
    rock: 0,
    bdy: 1.2,
  },
  vars: poseVars,
  bake: bakePose,
};

export const smug: Expression = {
  p: {
    esx: 1.3,
    esy: 0.42,
    tilt: 18,
    edy: -0.5,
    edx: 0.5,
    esx2: 0.06,
    esy2: -0.06,
    tilt2: -36,
    edy2: 0,
    lock: 1,
    heat: 0,
    shake: 0,
    rock: 0,
    bdy: -1,
  },
  vars: poseVars,
  bake: bakePose,
};

export const unsure: Expression = {
  p: {
    esx: 0.95,
    esy: 1.02,
    tilt: 4,
    edy: -0.2,
    edx: 0.3,
    esx2: 0.24,
    esy2: -0.44,
    tilt2: -18,
    edy2: 0,
    lock: 1,
    heat: 0,
    shake: 0,
    rock: 0,
    bdy: 0,
  },
  vars: poseVars,
  bake: bakePose,
};

export const scared: Expression = {
  p: {
    esx: 0.78,
    esy: 0.96,
    tilt: -12,
    edy: -1.5,
    edx: -0.8,
    esx2: -0.04,
    esy2: 0.05,
    tilt2: 4,
    edy2: 0,
    lock: 1,
    heat: 0,
    shake: 0.35,
    rock: 0,
    bdy: -0.6,
  },
  vars: poseVars,
  bake: bakePose,
};


export const love: Expression = {
  p: {
    esx: 0.86,
    esy: 1.28,
    tilt: -14,
    edy: -0.5,
    edx: -0.35,
    esx2: 0.05,
    esy2: 0.06,
    tilt2: 6,
    edy2: 0,
    lock: 1,
    heat: 0.6,
    shake: 0,
    rock: 0,
    bdy: -1.6,
  },
  vars: poseVars,
  bake: bakePose,
  tint: (pal, p) => tintWith(pal, p, ROSE),
};

export const shy: Expression = {
  p: {
    esx: 0.62,
    esy: 0.5,
    tilt: 10,
    edy: 1.4,
    edx: -0.2,
    esx2: -0.05,
    esy2: -0.04,
    tilt2: -8,
    edy2: 0,
    lock: 1,
    heat: 0.55,
    shake: 0,
    rock: 0,
    bdy: 0.9,
  },
  vars: poseVars,
  bake: bakePose,
  tint: (pal, p) => tintWith(pal, p, BLUSH),
};

export const sick: Expression = {
  p: {
    esx: 1.25,
    esy: 0.34,
    tilt: 20,
    edy: 1.8,
    edx: 0.8,
    esx2: 0.05,
    esy2: -0.05,
    tilt2: -6,
    edy2: 0,
    lock: 1,
    heat: 0.6,
    shake: 0.18,
    rock: 0,
    bdy: 1.4,
  },
  vars: poseVars,
  bake: bakePose,
  tint: (pal, p) => tintWith(pal, p, BILE),
};

export const thinking: Expression = {
  p: {
    esx: 1.15,
    esy: 0.62,
    tilt: 0,
    edy: 4.2,
    edx: 0.4,
    esx2: 0.02,
    esy2: 0.06,
    tilt2: 0,
    edy2: -8.4,
    lock: 1,
    heat: 0,
    shake: 0,
    rock: 0.8,
    bdy: -0.4,
  },
  vars: poseVars,
  bake: bakePose,
};
