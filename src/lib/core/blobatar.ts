import { motionVars, rootClass, type Animate } from "./animate";
import type { Palette } from "./color";
import type { Expression } from "./expression";
import {
  backdrop, makeBlobatar, makeParts, posed, resolve, tinted,
  type BlobatarOptions,
} from "./render";
import { style } from "./styles/blob";
import { marks, type Layout, type Mark } from "./styles/compose";
import type { Traits } from "./traits";

export type { BlobatarOptions, Animate, Expression, Mark };

export const blobatar = makeBlobatar(style);

const motion = (mode: Animate, e?: Expression) => (t: Traits, p: Palette) => {
  const pose = e ? e.vars(e.p) : {};
  const c = e?.tint ? e.tint(p, e.p) : p;
  return {
    cls: rootClass(mode, !!Object.keys(pose).length || !!e?.tint),
    vars: {
      ...motionVars(t),
      "--mo-head": c.head!,
      "--mo-eye": c.eye!,
      ...pose,
    },
  };
};

export function _parts(name: string, opts: BlobatarOptions = {}) {
  return makeParts(style)(
    name,
    opts,
    opts.animate && motion(opts.animate, opts.expression),
  );
}

export function _marks(name: string, opts: BlobatarOptions = {}): {
  bg: ReturnType<typeof backdrop>;
  transform: string;
  marks: Mark[];
} {
  const { t, palette } = resolve(name, opts, style.background);
  const p = tinted(palette, opts.expression);
  const pose = posed(style.layout(t), opts);
  return {
    bg: backdrop(style, opts, p),
    transform: pose.wrap,
    marks: marks(pose.l as Layout, p),
  };
}

export function _posed(name: string, opts: BlobatarOptions = {}) {
  const { t, palette } = resolve(name, opts, style.background);
  const l = style.layout(t) as Layout;
  const all = marks(l, palette);
  const e = opts.expression;
  const hot = e?.tint ? e.tint(palette, e.p) : null;
  const cut = all.length - l.eyes.length;
  return {
    bg: backdrop(style, opts, palette),
    marks: all.slice(0, cut),
    eyes: all.slice(cut) as Extract<Mark, { kind: "path" }>[],
    eyeFrames: l.eyes.map(({ cx, cy, rx, ry, rot }) => ({ cx, cy, rx, ry, rot })),
    pose: e?.p,
    expr: !!e && (!!Object.keys(e.vars(e.p)).length || !!e.tint),
    fill: { head: palette.head!, eye: palette.eye! },
    hot: hot ? { head: hot.head!, eye: hot.eye! } : null,
  };
}

export function _layout(name: string, opts: BlobatarOptions = {}) {
  const { t, palette } = resolve(name, opts, style.background);
  const l = style.layout(t) as Layout;
  const e = opts.expression;
  const posed = e ? e.bake(l as never, e.p).l : l;
  return {
    palette: (e?.tint ? e.tint(palette as Palette, e.p) : palette) as Palette,
    ...posed,
  };
}
