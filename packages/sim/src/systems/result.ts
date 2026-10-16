import { LISTEN_HOLD, REACHED_QUOTA, RUN_TICKS } from '../config.ts';
import { EndReason, NOT_SCHEDULED, Side, type State } from '../state.ts';

interface Ending {
  readonly side: Side;
  readonly reason: EndReason;
  readonly test: (state: State) => boolean;
}

const timeUp = (state: State): boolean => state.tick >= RUN_TICKS;

const listened = (state: State): boolean =>
  state.timers.listenSince !== NOT_SCHEDULED &&
  state.tick - state.timers.listenSince >= LISTEN_HOLD;

const ENDINGS: readonly Ending[] = [
  { side: Side.Agency, reason: EndReason.Overrun, test: (state) => state.control <= 0 },
  { side: Side.Agency, reason: EndReason.Listened, test: listened },
  { side: Side.Agency, reason: EndReason.Held, test: timeUp },
  {
    side: Side.Cockroach,
    reason: EndReason.ReachedGate,
    test: (state) => timeUp(state) && state.reached >= REACHED_QUOTA,
  },
  { side: Side.Cockroach, reason: EndReason.NextExam, test: timeUp },
];

const applies = (ending: Ending, state: State): boolean =>
  ending.side === state.side && ending.test(state);

export const resultSystem = (state: State): void => {
  for (const ending of ENDINGS) {
    if (applies(ending, state)) {
      state.endReason = ending.reason;
      state.endTick = state.tick;
      return;
    }
  }
};
