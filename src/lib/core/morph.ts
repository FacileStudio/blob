
export interface Pose {
    esx: number;
    esy: number;
    tilt: number;
    edy: number;
    edx: number;
    esx2: number;
    esy2: number;
    tilt2: number;
    edy2: number;
    lock: number;
    heat: number;
    shake: number;
    rock: number;
    bdy: number;
}

export const IDENT: Pose = {
  esx: 1,
  esy: 1,
  tilt: 0,
  edy: 0,
  edx: 0,
  esx2: 0,
  esy2: 0,
  tilt2: 0,
  edy2: 0,
  lock: 0,
  heat: 0,
  shake: 0,
  rock: 0,
  bdy: 0,
};

export interface Posable {
  eyes: { cx: number; cy: number; rx: number; ry: number; rot: number }[];
}

export const r3 = (v: number) => String(Math.round(v * 1000) / 1000);

export function bakePose<L extends Posable>(
  l: L,
  p: Pose,
): { l: L; wrap: string } {
  return {
    l: {
      ...l,
      eyes: l.eyes.map((e, i) => ({
        ...e,
        cx: e.cx + p.edx * (i ? 1 : -1),
        cy: e.cy + p.edy + (i ? p.edy2 : 0),
        rx: e.rx * (p.esx + (i ? p.esx2 : 0)),
        ry: e.ry * (p.esy + (i ? p.esy2 : 0)),
        rot: e.rot * (1 - p.lock) + (p.tilt + (i ? p.tilt2 : 0)) * (i ? 1 : -1),
      })),
    },
    wrap: p.bdy !== 0 ? `translate(0 ${r3(p.bdy)})` : "",
  };
}

export function poseTransforms<L extends Posable>(
  l: L,
  p: Pose,
  rockp = 1,
): { eyes: string[]; wrap: string } {
  return {
    eyes: l.eyes.map((e, i) => {
      const wrap = i ? 1 : -1;
      const sel = i ? 1 : 0;
      const lean = e.rot;
      const ph = sel * (1 - p.rock) + p.rock * ((1 + wrap * rockp) / 2);
      return (
        `translate(${r3(e.cx + p.edx * wrap)} ${r3(e.cy + p.edy + ph * p.edy2)})` +
        ` rotate(${r3((p.tilt + sel * p.tilt2) * wrap + lean * (1 - p.lock))})` +
        ` scale(${r3(p.esx + sel * p.esx2)} ${r3(p.esy + sel * p.esy2)})` +
        ` rotate(${r3(-lean)})` +
        ` translate(${r3(-e.cx)} ${r3(-e.cy)})`
      );
    }),
    wrap: `translate(0 ${r3(p.bdy)})`,
  };
}

export function lerpPose(a: Pose | undefined, b: Pose | undefined, t: number): Pose {
  const from = a ?? IDENT;
  const to = b ?? IDENT;
  const out = {} as Pose;
  for (const k in IDENT) {
    const c = k as keyof Pose;
    out[c] = from[c] * (1 - t) + to[c] * t;
  }
  return out;
}
