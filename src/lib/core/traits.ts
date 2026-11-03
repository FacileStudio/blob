import { seedState, stream } from "./hash";

export interface Traits {
    (key: string): number;
    num(key: string, min: number, max: number): number;
    int(key: string, min: number, max: number): number;
    pick<T>(key: string, options: readonly T[]): T;
    bool(key: string, p?: number): boolean;
    jitter(key: string, amount: number): number;
}

export type TraitOverrides = Record<string, number | number[]>;

export function traits(
  seed: string,
  normalize = true,
  overrides?: TraitOverrides,
): Traits {
  const state = seedState(seed, normalize);
  const t = ((key: string) => {
    const v = overrides?.[key];
    const o = Array.isArray(v) ? v[Math.floor(stream(state, key) * v.length)] : v;
    return o === undefined ? stream(state, key) : o > 0 ? (o < 1 ? o : 0.999999) : 0;
  }) as Traits;

  t.num = (key, min, max) => min + t(key) * (max - min);
  t.int = (key, min, max) => min + Math.floor(t(key) * (max - min + 1));
  t.pick = (key, options) => options[Math.floor(t(key) * options.length)]!;
  t.bool = (key, p = 0.5) => t(key) < p;
  t.jitter = (key, amount) => (t(key) * 2 - 1) * amount;

  return t;
}
