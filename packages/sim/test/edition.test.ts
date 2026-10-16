import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  dateFromDays,
  daysFromDate,
  editionDate,
  editionFromUtcMs,
  editionSeed,
} from '../src/index.ts';

describe('edition', () => {
  it('converts civil dates both ways', () => {
    expect(daysFromDate('1970-01-01')).toBe(0);
    expect(dateFromDays(0)).toBe('1970-01-01');
    expect(dateFromDays(daysFromDate('2028-02-29'))).toBe('2028-02-29');
    fc.assert(
      fc.property(fc.integer({ min: -100000, max: 100000 }), (days) => {
        expect(daysFromDate(dateFromDays(days))).toBe(days);
      }),
    );
  });

  it('starts edition 1 on the epoch date and turns over at midnight IST', () => {
    expect(editionDate(1)).toBe('2026-10-16');
    const midnightIst = Date.UTC(2026, 9, 16, 18, 30);
    expect(editionFromUtcMs(midnightIst - 1)).toBe(1);
    expect(editionFromUtcMs(midnightIst)).toBe(2);
  });

  it('gives every edition its own seed', () => {
    expect(editionSeed(1)).not.toBe(editionSeed(2));
    expect(editionSeed(7)).toBe(editionSeed(7));
  });
});
