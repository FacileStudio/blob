import type { Palette } from "../color";
import { superellipse } from "../shape";
import type { Traits } from "../traits";
import type { Body, Deco, Ellipse, Shape } from "./shapes";

export interface Eye {
  cx: number; cy: number; rx: number; ry: number; n: number; rot: number;
}

export type Fit = (t: Traits, b: Body, face: Ellipse) => Eye[];

export const faceFit: Fit = (t, b, face) => {
  const rx = b.rx;
  const er0 = t.num("eye.rx", 0.1, 0.14) * rx;
  const ratio = t.num("eye.ratio", 1.0, 1.25);
  const scale = t.num("eye.scale", 0.92, 1.08);
  const clearance = t.num("eye.gap", 0.1, 0.22) * rx;
  const wide = er0 * Math.max(1, scale);
  const tall = er0 * ratio * Math.max(1, scale);
  const gap0 = wide + rx * 0.04 + clearance;

  const gx = t.jitter("gaze.x", 0.08) * face.rx;
  const gy = t.num("gaze.y", -0.15, 0.05) * face.ry;
  const dy = t.jitter("eye.dy", 0.02) * face.ry;
  const reach = Math.hypot(wide, tall);
  const need = Math.hypot(
    (Math.abs(gx) + gap0 + reach) / face.rx,
    (Math.abs(gy) + Math.abs(dy) + reach) / face.ry,
  );
  const fit = need > 0.88 ? 0.88 / need : 1;

  const er = er0 * fit;
  const eyeRy = er * ratio;
  const gap = gap0 * fit;

  const cx = face.cx + gx * fit;
  const cy = face.cy + gy * fit;
  return [
    { cx: cx - gap, cy, rx: er, ry: eyeRy, n: 2, rot: 0 },
    {
      cx: cx + gap, cy: cy + dy * fit,
      rx: er * scale, ry: eyeRy * scale,
      n: 2, rot: 0,
    },
  ];
};

export type Band = readonly [Shape, number];

export function compose(bands: Band[], fit: Fit) {
  const pick = (v: number) => (bands.find(([, upTo]) => v < upTo) ?? bands[bands.length - 1]!)[0];

  function layout(t: Traits) {
    const shape = pick(t("shape"));
    const r = t.num("body.r", 31, 38) * shape.core;
    const body: Body = {
      cx: 50 + t.jitter("body.x", 1.5),
      cy: 50 + t.jitter("body.y", 1.5),
      rx: r,
      ry: r * t.num("body.ratio", 0.92, 1.08),
      n: t.num("body.n", 1.9, 2.5),
      rot: 0,
      radii: Array.from({ length: t.int("body.pts", 6, 8) }, (_, i) => 1 + t.jitter(`body.r${i}`, 0.16)),
    };
    shape.body?.(t, body);

    const face = shape.face?.(body) ?? body;
    const deco: Deco = { petals: [], extra: [] };
    shape.decorate?.(t, body, deco);

    return {
      shape: shape.name,
      draw: shape.path,
      body, face,
      petals: deco.petals,
      extra: deco.extra,
      eyes: fit(t, body, face),
    };
  }

  function render(l: ReturnType<typeof layout>, p: Palette, mo?: boolean): string {
    const r2 = (v: number) => Math.round(v * 100) / 100;
    const eye = (e: Eye, i: number) => {
      const path = `<path d="${superellipse(e)}"/>`;
      return mo
        ? `<g class="mo-eye" style="--mo-wrap:${i ? 1 : -1};--mo-lean:${r2(e.rot)};transform-origin:${r2(e.cx)}px ${r2(e.cy)}px">${path}</g>`
        : path;
    };
    const body =
      `<g fill="${p.head}">` +
      l.petals.map(d => `<circle cx="${r2(d.cx)}" cy="${r2(d.cy)}" r="${r2(d.r)}"/>`).join("") +
      l.extra.map(d => `<path d="${d}"/>`).join("") +
      `<path d="${l.draw ? l.draw(l.body) : superellipse(l.body)}"/>` +
      `</g>` +
      `<g fill="${p.eye}"${mo ? ` class="mo-eyes"` : ""}>` +
      l.eyes.map(eye).join("") +
      `</g>`;
    return mo ? `<g class="mo-breathe"><g class="mo-bob">${body}</g></g>` : body;
  }

  return { layout, render, background: false as const };
}

export type Mark =
  | { kind: "path"; d: string; fill: string }
  | { kind: "circle"; cx: number; cy: number; r: number; fill: string };

export function marks(l: Layout, p: Palette): Mark[] {
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const head = p.head!;
  return [
    ...l.petals.map((d): Mark => ({ kind: "circle", cx: r2(d.cx), cy: r2(d.cy), r: r2(d.r), fill: head })),
    ...l.extra.map((d): Mark => ({ kind: "path", d, fill: head })),
    { kind: "path", d: l.draw ? l.draw(l.body) : superellipse(l.body), fill: head },
    ...l.eyes.map((e): Mark => ({ kind: "path", d: superellipse(e), fill: p.eye! })),
  ];
}

export type Layout = ReturnType<ReturnType<typeof compose>["layout"]>;
