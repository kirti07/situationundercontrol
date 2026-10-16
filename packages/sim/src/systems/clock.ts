import type { State } from '../state.ts';

export const clockSystem = (state: State): void => {
  state.tick += 1;
};
