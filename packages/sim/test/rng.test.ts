import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { hashString, nextInt, nextU32, seedRng } from '../src/rng.ts';

describe('rng', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = seedRng(1234);
    const b = seedRng(1234);
    const first = Array.from({ length: 5 }, () => nextU32(a));
    expect(Array.from({ length: 5 }, () => nextU32(b))).toEqual(first);
    expect(first).toMatchInlineSnapshot(`
      [
        868627888,
        3415435670,
        3504306223,
        4095998852,
        1306403673,
      ]
    `);
  });

  it('keeps nextInt inside its bound', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: 1, max: 1000 }), (seed, bound) => {
        const value = nextInt(seedRng(seed), bound);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(bound);
      }),
    );
  });

  it('hashes strings with FNV-1a', () => {
    expect(hashString('')).toBe(0x811c9dc5);
    expect(hashString('a')).toBe(0xe40c292c);
  });
});
