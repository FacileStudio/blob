
const SEP = 0xff;

function feed(h: number, bytes: Uint8Array): number {
  for (let i = 0; i < bytes.length; i++) {
    h = Math.imul(h ^ bytes[i]!, 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h;
}

function finalize(h: number): number {
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

const utf8 = new TextEncoder();

export function normalizeSeed(seed: string): string {
  return seed.normalize("NFC").trim().toLowerCase();
}

export function seedState(seed: string, normalize = true): number {
  const s = normalize ? normalizeSeed(seed) : seed;
  return feed(1779033703 ^ s.length, utf8.encode(s));
}

export function stream(state: number, key: string): number {
  return finalize(feed(feed(state, Uint8Array.of(SEP)), utf8.encode(key))) / 4294967296;
}
