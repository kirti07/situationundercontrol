import { SYMPATHY_DECAY_DELAY, SYMPATHY_DECAY_PER_TICK } from '../config.ts';
import type { State } from '../state.ts';

export const sympathySystem = (state: State): void => {
  if (state.tick - state.lastSmashTick < SYMPATHY_DECAY_DELAY) return;
  state.sympathy = Math.max(0, state.sympathy - SYMPATHY_DECAY_PER_TICK);
};
