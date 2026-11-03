import type { Traits } from "./traits";

export type Animate = "hover" | "always";

export const rootClass = (mode: Animate, expressive?: boolean) =>
  `mo-root${mode === "always" ? " mo-always" : ""}${expressive ? " mo-expr" : ""}`;

export interface IdleSeeds {
    phase: number;
    bob: number;
    blink: number;
  blinkPhase: number;
    saccade: number;
  saccadePhase: number;
    lookX: number;
  lookY: number;
    lookMX: number;
  lookMY: number;
}

export function motionSeeds(t: Traits): IdleSeeds {
  const blink = Math.round(t.num("motion.blink", 3500, 6500));
  const saccade = Math.round(t.num("motion.saccade", 4200, 7600));
  const lookX = t.num("motion.lookX", 1, 2.2);
  const lookY = t.num("motion.lookY", 0.8, 1.7);
  const r2 = (v: number) => Math.round(v * 100) / 100;
  return {
    phase: Math.round(t.num("motion.phase", 0, 2800)),
    bob: Math.round(t.num("motion.bob", 0, 3400)),
    blink,
    blinkPhase: Math.round(t.num("motion.blinkPhase", 0, blink)),
    saccade,
    saccadePhase: Math.round(t.num("motion.saccadePhase", 0, saccade)),
    lookX: r2(lookX) * (t.bool("motion.lookXFlip") ? -1 : 1),
    lookY: r2(lookY) * (t.bool("motion.lookYFlip") ? -1 : 1),
    lookMX: r2(lookX),
    lookMY: r2(lookY),
  };
}

export function motionVars(t: Traits): Record<string, string> {
  const ms = (v: number) => `${-v}ms`;
  const s = motionSeeds(t);
  return {
    "--mo-phase": ms(s.phase),
    "--mo-bob-phase": ms(s.bob),
    "--mo-blink": `${s.blink}ms`,
    "--mo-blink-phase": ms(s.blinkPhase),

    "--mo-look-x": String(s.lookX),
    "--mo-look-mx": String(s.lookMX),
    "--mo-look-y": String(s.lookY),
    "--mo-look-my": String(s.lookMY),
    "--mo-saccade": `${s.saccade}ms`,
    "--mo-saccade-phase": ms(s.saccadePhase),
  };
}

export const serializeVars = (vars: Record<string, string>) =>
  Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
