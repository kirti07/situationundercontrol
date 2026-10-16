import { describe, expect, it } from 'vitest';
import {
  BASE_SPEED,
  MAX_GENERATION,
  PHASE_BY_MINUTE,
  RUN_TICKS,
  SPEED_BY_GENERATION,
} from '../src/index.ts';

describe('config', () => {
  it('runs 5:30 PM to 9:00 PM at one game minute per second', () => {
    expect(RUN_TICKS).toBe(12600);
  });

  it('makes each Hydra generation 10% faster, capped at 2x', () => {
    expect(SPEED_BY_GENERATION[0]).toBe(BASE_SPEED);
    expect(SPEED_BY_GENERATION[1]).toBe(Math.floor((BASE_SPEED * 11) / 10));
    expect(SPEED_BY_GENERATION[MAX_GENERATION]).toBe(BASE_SPEED * 2);
    expect(Array.from(SPEED_BY_GENERATION)).toEqual([...SPEED_BY_GENERATION].sort((a, b) => a - b));
  });

  it('switches phases at 6, 7 and 8 PM', () => {
    expect(PHASE_BY_MINUTE[29]?.metroGrowth).toBe(0);
    expect(PHASE_BY_MINUTE[30]?.metroGrowth).toBe(1);
    expect(PHASE_BY_MINUTE[89]?.roadInterval).toBe(0);
    expect(PHASE_BY_MINUTE[90]?.roadInterval).toBe(240);
    expect(PHASE_BY_MINUTE[150]?.roadInterval).toBe(120);
  });
});
