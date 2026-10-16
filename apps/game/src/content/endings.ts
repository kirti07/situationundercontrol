import { EndReason, RUN_MINUTES, TICKS_PER_MINUTE, type State } from '@suc/sim';
import { clockLabel, countLabel } from './format.ts';

export interface EndingCopy {
  readonly headline: string;
  readonly score: (state: State) => string;
}

export const ENDINGS: Readonly<Record<EndReason, EndingCopy>> = {
  [EndReason.None]: { headline: '', score: () => '' },
  [EndReason.Overrun]: {
    headline: 'SITUATION UNDER CONTROL',
    score: (state) => `Held till ${clockLabel(state.endTick)}`,
  },
  [EndReason.Held]: {
    headline: 'SITUATION ACTUALLY UNDER CONTROL',
    score: (state) =>
      `Held till ${clockLabel(RUN_MINUTES * TICKS_PER_MINUTE)} with ${String(state.control)}% Control`,
  },
  [EndReason.Listened]: { headline: 'RESULTS DECLARED ON TIME', score: () => '' },
  [EndReason.ReachedGate]: {
    headline: 'WE REACHED THE GATE',
    score: (state) => `${countLabel(state.reached)} reached`,
  },
  [EndReason.NextExam]: {
    headline: 'SEE YOU AT THE NEXT EXAM',
    score: (state) => `${countLabel(state.reached)} reached`,
  },
};
