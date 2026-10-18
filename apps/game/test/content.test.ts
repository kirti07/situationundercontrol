import { FAKE_TELLS, PLACARD_PAIRS } from '@suc/sim';
import { describe, expect, it } from 'vitest';
import { FAKE_TELLS_TEXT, PLACARDS } from '../src/content/moments.ts';

describe('moment content', () => {
  it('has exactly as many cards as the sim deals', () => {
    expect(FAKE_TELLS_TEXT).toHaveLength(FAKE_TELLS);
    expect(PLACARDS).toHaveLength(PLACARD_PAIRS);
  });

  it('never repeats a headline', () => {
    expect(new Set(PLACARDS.map((placard) => placard.headline)).size).toBe(PLACARDS.length);
  });
});
