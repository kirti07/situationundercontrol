import { RUN_MINUTES, TICKS_PER_MINUTE } from './config.ts';
import { EndReason, type State } from './state.ts';

const SCORES: Record<EndReason, (state: State) => number> = {
  [EndReason.None]: () => 0,
  [EndReason.Overrun]: (state) => Math.floor(state.endTick / TICKS_PER_MINUTE),
  [EndReason.Held]: () => RUN_MINUTES,
  [EndReason.Listened]: () => 0,
  [EndReason.ReachedGate]: (state) => state.reached,
  [EndReason.NextExam]: (state) => state.reached,
};

export const scoreOf = (state: State): number => SCORES[state.endReason](state);
