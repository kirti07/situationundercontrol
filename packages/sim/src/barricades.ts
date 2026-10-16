import { BARRICADE_SLOTS } from './config.ts';
import { LANES, subOf } from './map.ts';
import { emit, EventKind, NO_BARRICADE, type State } from './state.ts';

export const barricadeCount = (state: State): number =>
  state.barricades.lane.reduce((count, lane) => count + (lane === NO_BARRICADE ? 0 : 1), 0);

const slotFor = (state: State, lane: number, y: number): number => {
  const { barricades } = state;
  for (let slot = 0; slot < BARRICADE_SLOTS; slot += 1) {
    if (barricades.lane[slot] === lane && barricades.y[slot] === y) return slot;
  }
  return state.barricades.lane.indexOf(NO_BARRICADE);
};

export const raiseBarricade = (state: State, lane: number, yUnits: number): void => {
  const y = subOf(yUnits);
  const slot = slotFor(state, lane, y);
  if (slot === NO_BARRICADE) return;
  state.barricades.lane[slot] = lane;
  state.barricades.y[slot] = y;
  emit(state, EventKind.Barricade, subOf(LANES[lane]?.centerX ?? 0), y, lane);
};
