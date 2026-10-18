import { LATHI_MAX, LATHI_REFILL } from '../config.ts';
import { NOT_SCHEDULED, type State } from '../state.ts';

export const lathiSystem = (state: State): void => {
  const { timers } = state;
  if (timers.lathiRefillAt === NOT_SCHEDULED || state.tick < timers.lathiRefillAt) return;
  state.lathis += 1;
  timers.lathiRefillAt = state.lathis < LATHI_MAX ? state.tick + LATHI_REFILL : NOT_SCHEDULED;
};
