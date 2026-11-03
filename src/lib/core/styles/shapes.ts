import { blobPath, box, polygon, taper } from "../shape";
import type { Traits } from "../traits";

export interface Body {
  cx: number; cy: number; rx: number; ry: number;
  n: number; rot: number; radii: number[];
    sides?: number; round?: number;
}
export interface Ellipse { cx: number; cy: number; rx: number; ry: number }
export interface Deco {
  petals: { cx: number; cy: number; r: number }[];
    extra: string[];
}

export interface Shape {
  name: string;
    core: number;
    body?(t: Traits, b: Body): void;
    face?(b: Body): Ellipse;
  decorate?(t: Traits, b: Body, out: Deco): void;
    path?(b: Body): string;
}


const poly = (b: Body) => polygon(b as Body & { sides: number; round: number });
const spline = (b: Body) => blobPath(b.cx, b.cy, b.rx, b.ry, b.radii, b.rot);

const shrunk = (k: number) => (b: Body): Ellipse => ({
  cx: b.cx, cy: b.cy, rx: b.rx * k, ry: b.ry * k,
});
const splineFace = (b: Body): Ellipse => shrunk(Math.min(...b.radii) * 0.95)(b);
const polyFace = (b: Body): Ellipse => shrunk(0.84)(b);


export const round: Shape = { name: "round", core: 1 };

export const organic: Shape = {
  name: "organic", core: 0.98, path: spline, face: splineFace,
};

export const boxy: Shape = {
  name: "boxy", core: 0.86,
  body: (t, b) => {
    b.n = t.num("body.n", 3.4, 6);
    b.rot = t.num("body.rot", -20, 20);
  },
};

export const capsule: Shape = {
  name: "capsule", core: 1.02,
  body: (t, b) => { b.ry *= t.num("capsule.squat", 0.55, 0.68); },
  face: shrunk(0.94),
  decorate: (_t, b, out) => {
    for (const s of [-1, 1]) out.petals.push({ cx: b.cx + s * (b.rx - b.ry), cy: b.cy, r: b.ry });
  },
  path: b => box(b.cx, b.cy, b.rx - b.ry, b.ry),
};

export const nub: Shape = {
  name: "nub", core: 0.88,
  decorate: (t, b, out) => {
    const count = t.int("nub.n", 1, 2);
    for (let i = 0; i < count; i++) {
      const a = t.num(`nub.a${i}`, 0, 2 * Math.PI);
      out.petals.push({
        cx: b.cx + Math.cos(a) * b.rx * 0.88,
        cy: b.cy + Math.sin(a) * b.rx * 0.88,
        r: b.rx * t.num(`nub.r${i}`, 0.24, 0.4),
      });
    }
  },
};

export const cloud: Shape = {
  name: "cloud", core: 0.78, face: splineFace, path: spline,
  decorate: (t, b, out) => {
    const count = t.int("cloud.n", 4, 6);
    for (let i = 0; i < count; i++) {
      const a = Math.PI + (Math.PI * (i + 0.5)) / count;
      out.petals.push({
        cx: b.cx + Math.cos(a) * b.rx * 0.8,
        cy: b.cy + Math.sin(a) * b.rx * 0.5,
        r: b.rx * t.num(`cloud.r${i}`, 0.44, 0.62),
      });
    }
  },
};

export const droplet: Shape = {
  name: "droplet", core: 0.78,
  body: (_t, b) => { b.cy += 0.22 * b.ry; b.n = 2; },
  face: b => ({ cx: b.cx, cy: b.cy + b.ry * 0.05, rx: b.rx * 0.88, ry: b.ry * 0.88 }),
  decorate: (t, b, out) => {
    out.extra.push(taper(b.cx, b.cy, b.rx, b.ry, t.num("droplet.tip", 1.4, 1.65)));
  },
};

export const hexagon: Shape = {
  name: "hexagon", core: 1.05, path: poly, face: polyFace,
  body: (t, b) => {
    b.sides = 6;
    b.rot = t.num("body.rot", -12, 12);
    b.round = t.num("poly.round", 0.24, 0.5);
  },
};

export const sun: Shape = {
  name: "sun", core: 0.7,
  decorate: (t, b, out) => {
    const count = t.int("sun.n", 6, 9);
    const dist = b.rx * t.num("sun.dist", 1.0, 1.08);
    const pr = b.rx * t.num("sun.r", 0.2, 0.26);
    const off = t.num("sun.rot", 0, 2 * Math.PI);
    for (let i = 0; i < count; i++) {
      const a = off + (2 * Math.PI * i) / count;
      out.petals.push({ cx: b.cx + Math.cos(a) * dist, cy: b.cy + Math.sin(a) * dist, r: pr });
    }
  },
};

export const triangle: Shape = {
  name: "triangle", core: 1.15, path: poly,
  body: (t, b) => {
    b.sides = 3;
    b.rot = t.num("body.rot", -5, 5);
    b.round = t.num("poly.round", 0.24, 0.5);
  },
  face: b => ({ cx: b.cx, cy: b.cy + b.ry * 0.1, rx: b.rx * 0.54, ry: b.ry * 0.36 }),
};
