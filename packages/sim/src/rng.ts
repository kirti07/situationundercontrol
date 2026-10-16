const UINT32 = 4294967296;

export const hashString = (text: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  }
  return hash >>> 0;
};

export const nextU32 = (rng: Uint32Array): number => {
  const a = rng[0] ?? 0;
  const b = rng[1] ?? 0;
  const c = rng[2] ?? 0;
  const d = rng[3] ?? 0;
  const result = (a + b + d) >>> 0;
  rng[0] = b ^ (b >>> 9);
  rng[1] = c + (c << 3);
  rng[2] = ((c << 21) | (c >>> 11)) + result;
  rng[3] = d + 1;
  return result;
};

export const seedRng = (seed: number): Uint32Array => {
  const rng = Uint32Array.of(0x9e3779b9, 0x243f6a88, seed >>> 0, 1);
  for (let i = 0; i < 12; i += 1) {
    nextU32(rng);
  }
  return rng;
};

export const nextInt = (rng: Uint32Array, bound: number): number =>
  Math.floor((nextU32(rng) * bound) / UINT32);

export const nextRange = (rng: Uint32Array, min: number, max: number): number =>
  min + nextInt(rng, max - min + 1);
