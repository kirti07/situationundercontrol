import { CLIMB_CLEARANCE, CLIMB_THRESHOLD, MAX_ACTIVE, SUB } from '../config.ts';
import { laneAtSub } from '../map.ts';
import { emit, EventKind, modeOf, NO_BARRICADE, RoachMode, type State } from '../state.ts';

const crosses = (state: State, slot: number, barricade: number, lane: number): boolean => {
  const { roaches, barricades } = state;
  const line = barricades.y[barricade] ?? 0;
  return (
    barricades.lane[barricade] === lane &&
    (roaches.py[slot] ?? 0) >= line &&
    (roaches.y[slot] ?? 0) < line
  );
};

const blockingBarricade = (state: State, slot: number): number => {
  const lane = laneAtSub(state.roaches.x[slot] ?? 0);
  for (let barricade = 0; barricade < state.barricades.lane.length; barricade += 1) {
    if (crosses(state, slot, barricade, lane)) return barricade;
  }
  return NO_BARRICADE;
};

const pileUp = (state: State, slot: number): void => {
  const barricade = blockingBarricade(state, slot);
  if (barricade === NO_BARRICADE) return;
  const { roaches, barricades } = state;
  roaches.y[slot] = barricades.y[barricade] ?? 0;
  roaches.mode[slot] = RoachMode.Piled;
  roaches.heldBy[slot] = barricade;
  barricades.pile[barricade] = (barricades.pile[barricade] ?? 0) + 1;
};

const finishClimb = (state: State, slot: number): void => {
  const { roaches, barricades } = state;
  const line = barricades.y[roaches.heldBy[slot] ?? 0] ?? 0;
  if ((roaches.y[slot] ?? 0) > line - CLIMB_CLEARANCE * SUB) return;
  roaches.mode[slot] = RoachMode.Walking;
  roaches.heldBy[slot] = NO_BARRICADE;
};

const climbOver = (state: State, barricade: number): void => {
  const { roaches, barricades } = state;
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    if (roaches.heldBy[slot] === barricade && modeOf(state, slot) === RoachMode.Piled) {
      roaches.mode[slot] = RoachMode.Climbing;
    }
  }
  barricades.pile[barricade] = 0;
  emit(state, EventKind.Climb, 0, barricades.y[barricade] ?? 0, barricades.lane[barricade] ?? 0);
};

const ROACH_STEP: Readonly<Record<RoachMode, (state: State, slot: number) => void>> = {
  [RoachMode.Walking]: pileUp,
  [RoachMode.Piled]: () => undefined,
  [RoachMode.Climbing]: finishClimb,
};

export const barricadeSystem = (state: State): void => {
  const { roaches, barricades } = state;
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    if (roaches.alive[slot] === 1) ROACH_STEP[modeOf(state, slot)](state, slot);
  }
  for (let barricade = 0; barricade < barricades.pile.length; barricade += 1) {
    if ((barricades.pile[barricade] ?? 0) >= CLIMB_THRESHOLD) climbOver(state, barricade);
  }
};
