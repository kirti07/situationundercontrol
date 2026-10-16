import { MAX_ACTIVE } from '../config.ts';
import { ARCH_CELLS, cellOfSub } from '../map.ts';
import { removeRoach } from '../roaches.ts';
import { emit, EventKind, Side, type State } from '../state.ts';

const ENTRY_EFFECT: Record<Side, (state: State) => void> = {
  [Side.Agency]: (state) => {
    state.control = Math.max(0, state.control - 1);
  },
  [Side.Cockroach]: (state) => {
    state.reached += 1;
  },
};

const inArch = (state: State, slot: number): boolean =>
  state.roaches.alive[slot] === 1 &&
  ARCH_CELLS[cellOfSub(state.roaches.x[slot] ?? 0, state.roaches.y[slot] ?? 0)] === 1;

export const archSystem = (state: State): void => {
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    if (inArch(state, slot)) {
      emit(state, EventKind.Enter, state.roaches.x[slot] ?? 0, state.roaches.y[slot] ?? 0, 1);
      removeRoach(state, slot);
      ENTRY_EFFECT[state.side](state);
    }
  }
};
