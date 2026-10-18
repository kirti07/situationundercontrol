import { describe, expect, it } from 'vitest';
import { BOTS, type BotName } from '../balance/bots.ts';
import { editionSeeds, playSeeds } from '../balance/run.ts';

const SEEDS = editionSeeds(3);

const median = (name: BotName): number => playSeeds(BOTS[name], SEEDS).median;

describe('balance ordering', () => {
  it('Agency: smashing everything falls before doing nothing, which falls before restraint', () => {
    const spam = median('agency spam');
    const idle = median('agency idle');
    const restraint = median('agency restraint');
    expect(spam).toBeLessThan(idle);
    expect(idle).toBeLessThan(restraint);
  }, 60_000);

  it('Cockroaches: leading beats idling, and answering moments on top beats leading alone', () => {
    const idle = median('cockroach idle');
    const leads = median('cockroach leads only');
    const moments = median('cockroach leads + 70% of moments');
    expect(idle).toBeLessThan(leads);
    expect(leads).toBeLessThan(moments);
  }, 60_000);
});
