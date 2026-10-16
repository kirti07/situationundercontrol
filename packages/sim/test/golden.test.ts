import { describe, expect, it } from 'vitest';
import {
  Character,
  createRun,
  hashState,
  InputKind,
  replay,
  Side,
  type Input,
} from '../src/index.ts';

const taps: Input[] = Array.from({ length: 600 }, (_, i) => ({
  tick: 300 + i * 17,
  kind: InputKind.Tap,
  pointer: i % 2,
  x: 30 + ((i * 53) % 300),
  y: 200 + ((i * 97) % 420),
}));

describe('golden replays', () => {
  it('pins the Agency end state for a fixed log', () => {
    const state = replay({ seed: 153, side: Side.Agency, character: Character.PrimeTime }, taps);
    expect({
      hash: hashState(state),
      endReason: state.endReason,
      endTick: state.endTick,
    }).toMatchSnapshot();
  });

  it('pins the cockroach end state with no input', () => {
    const state = replay({ seed: 153, side: Side.Cockroach, character: Character.None }, []);
    expect({ hash: hashState(state), reached: state.reached }).toMatchSnapshot();
  });

  it('is identical across repeated runs', () => {
    const setup = { seed: 9, side: Side.Agency, character: Character.Chanakya } as const;
    expect(hashState(replay(setup, taps))).toBe(hashState(replay(setup, taps)));
    expect(hashState(createRun(setup))).toBe(hashState(createRun(setup)));
  });
});
