import type { Animate } from "./animate";
import { palette as buildPalette, type Palette } from "./color";
import type { Expression, Posable } from "./expression";
import { superellipse } from "./shape";
import { traits, type TraitOverrides, type Traits } from "./traits";

export interface BlobatarOptions {
    size?: number;
    background?: boolean | "square" | "circle" | "squircle";
    backgroundColor?: string;
    palette?: Palette;
    hue?: number;
    tone?: number;
    traits?: TraitOverrides;
    normalize?: boolean;
    contrast?: boolean;
    title?: string;
    animate?: Animate;
    expression?: Expression;
}

export interface Style<L> {
  layout(t: Traits): L;
    render(l: L, p: Palette, mo?: boolean): string;
  background: boolean | "square" | "circle" | "squircle";
}

export function posed<L>(l: L, opts: BlobatarOptions, animate?: unknown) {
  const e = opts.expression;
  if (animate || !e) return { l, wrap: "" };
  return e.bake(l as L & Posable, e.p);
}

export const tinted = (p: Palette, e?: Expression) => (e?.tint ? e.tint(p, e.p) : p);

const wrap = (body: string, t: string) =>
  t ? `<g transform="${t}">${body}</g>` : body;

const escape = (s: string) =>
  s.replace(/[&<>]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;",
  );

export function resolve(
  seed: string,
  opts: BlobatarOptions,
  plate: Style<unknown>["background"],
) {
  const t = traits(seed, opts.normalize ?? true, opts.traits);
  return {
    t,
    palette: {
      ...buildPalette(
        opts.hue ?? t.num("hue", 0, 360),
        opts.contrast ?? true,
        opts.tone ?? t("tone"),
        (opts.background ?? plate) === false ? undefined : opts.backgroundColor,
      ),
      ...opts.palette,
    } as Palette,
  };
}

const label = (opts: BlobatarOptions) =>
  opts.title ? `<title>${escape(opts.title)}</title>` : "";

export interface Backdrop {
  d: string;
  fill: string;
}

export function backdrop<L>(
  style: Style<L>,
  opts: BlobatarOptions,
  p: Palette,
): Backdrop | undefined {
  const bg = opts.background ?? style.background;
  if (bg === false) return undefined;
  return {
    d:
      bg === "square"
        ? "M0 0H100V100H0Z"
        : superellipse({
            cx: 50,
            cy: 50,
            rx: 50,
            ry: 50,
            n: bg === "circle" ? 2 : 6,
          }),
    fill: p.bg!,
  };
}

const plate = (b?: Backdrop) => (b ? `<path d="${b.d}" fill="${b.fill}"/>` : "");

export interface Motion {
  cls: string;
  vars: Record<string, string>;
}

export type MotionFactory = (t: Traits, p: Palette) => Motion;

export function makeBlobatar<L>(style: Style<L>) {
  return (name: string, opts: BlobatarOptions = {}): string => {
    const { t, palette } = resolve(name, opts, style.background);
    const p = tinted(palette, opts.expression);
    const dim = opts.size ? ` width="${opts.size}" height="${opts.size}"` : "";
    const pose = posed(style.layout(t), opts);
    const body =
      label(opts) +
      plate(backdrop(style, opts, p)) +
      wrap(style.render(pose.l, p), pose.wrap);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"${dim}>${body}</svg>`;
  };
}

export function makeParts<L>(style: Style<L>) {
  return (
    name: string,
    opts: BlobatarOptions = {},
    motion?: MotionFactory,
  ) => {
    const { t, palette: p } = resolve(name, opts, style.background);
    const mo = motion?.(t, p);
    const pose = posed(style.layout(t), opts, mo);

    return {
            cls: mo?.cls,
      bg: backdrop(style, opts, p),
            inner: wrap(style.render(pose.l, p, !!mo), pose.wrap),
      vars: mo?.vars,
    };
  };
}
