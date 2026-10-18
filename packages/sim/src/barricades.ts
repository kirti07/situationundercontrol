import { BARRICADE_SLOTS, MAX_ACTIVE } from './config.ts';
import { LANES, subOf } from './map.ts';
import { emit, EventKind, NO_BARRICADE, NOT_SCHEDULED, RoachMode, type State } from './state.ts';

export const barricadeCount = (state: State): number =>
  state.barricades.lane.reduce((count, lane) => count + (lane === NO_BARRICADE ? 0 : 1), 0);

const slotFor = (state: State, lane: number, y: number): number => {
  const { barricades } = state;
  for (let slot = 0; slot < BARRICADE_SLOTS; slot += 1) {
    if (barricades.lane[slot] === lane && barricades.y[slot] === y) return slot;
  }
  return state.barricades.lane.indexOf(NO_BARRICADE);
};

export const raiseBarricade = (
  state: State,
  lane: number,
  yUnits: number,
  expiresAt = NOT_SCHEDULED,
): void => {
  const y = subOf(yUnits);
  const slot = slotFor(state, lane, y);
  if (slot === NO_BARRICADE) return;
  state.barricades.lane[slot] = lane;
  state.barricades.y[slot] = y;
  state.barricades.expiresAt[slot] = expiresAt;
  emit(state, EventKind.Barricade, subOf(LANES[lane]?.centerX ?? 0), y, lane);
};

export const takeDown = (state: State, barricade: number): void => {
  const { roaches, barricades } = state;
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    if (roaches.heldBy[slot] !== barricade) continue;
    roaches.mode[slot] = RoachMode.Walking;
    roaches.heldBy[slot] = NO_BARRICADE;
  }
  barricades.lane[barricade] = NO_BARRICADE;
  barricades.pile[barricade] = 0;
  barricades.expiresAt[barricade] = NOT_SCHEDULED;
};
