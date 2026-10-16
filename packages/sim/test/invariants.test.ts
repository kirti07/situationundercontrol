import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  createRun,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  InputKind,
  isOver,
  MAX_ACTIVE,
  RUN_TICKS,
  step,
  swarmOf,
  type Input,
} from '../src/index.ts';
import { AGENCY, aliveSlots } from './helpers.ts';

const taps = fc
  .array(
    fc.record({
      tick: fc.integer({ min: 0, max: RUN_TICKS - 1 }),
      kind: fc.constant(InputKind.Tap),
      pointer: fc.integer({ min: 0, max: 1 }),
      x: fc.integer({ min: 0, max: FIELD_WIDTH }),
      y: fc.integer({ min: 120, max: FIELD_HEIGHT - 132 }),
    }),
    { maxLength: 400 },
  )
  .map((inputs): Input[] => inputs.toSorted((a, b) => a.tick - b.tick));

const RUNS = Number(process.env.SIM_INVARIANT_RUNS ?? 40);

describe('sim invariants', () => {
  it('keeps Swarm, Became, Control and the 400 cap consistent on every tick', () => {
    fc.assert(
      fc.property(taps, fc.integer(), (inputs, seed) => {
        const state = createRun({ ...AGENCY, seed });
        let cursor = 0;
        while (!isOver(state)) {
          const before = { became: state.became, control: state.control };
          const batch = inputs.slice(cursor).filter((input) => input.tick === state.tick);
          cursor += batch.length;
          step(state, batch);
          expect(swarmOf(state)).toBeGreaterThanOrEqual(0);
          expect(state.became).toBeGreaterThanOrEqual(before.became);
          expect(state.control).toBeLessThanOrEqual(before.control);
          expect(state.active).toBeLessThanOrEqual(MAX_ACTIVE);
        }
        expect(aliveSlots(state)).toHaveLength(state.active);
      }),
      { numRuns: RUNS },
    );
  });
});
