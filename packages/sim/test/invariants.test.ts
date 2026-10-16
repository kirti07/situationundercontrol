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
        const broken: string[] = [];
        let cursor = 0;
        while (!isOver(state)) {
          const before = { became: state.became, control: state.control };
          const start = cursor;
          while (inputs[cursor]?.tick === state.tick) cursor += 1;
          step(state, inputs.slice(start, cursor));
          const checks: readonly [boolean, string][] = [
            [swarmOf(state) >= 0, 'swarm negative'],
            [state.became >= before.became, 'became fell'],
            [state.control <= before.control, 'control rose'],
            [state.active <= MAX_ACTIVE, 'over the cap'],
          ];
          broken.push(
            ...checks.filter(([ok]) => !ok).map(([, name]) => `${name} at ${String(state.tick)}`),
          );
        }
        expect(broken).toEqual([]);
        expect(aliveSlots(state)).toHaveLength(state.active);
      }),
      { numRuns: RUNS },
    );
  }, 60_000);
});
