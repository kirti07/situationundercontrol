import {
  CELL,
  FIELD_RESERVE,
  GRID_COLS,
  JOINER_JITTER,
  HYDRA_CHILDREN,
  MAX_GENERATION,
  RESPAWN_IMMUNITY,
} from './config.ts';
import { cellOf, LANE_COUNT, LANES, METRO_Y, NEAREST_OPEN, subOf } from './map.ts';
import { nextInt, nextRange } from './rng.ts';
import {
  addSympathy,
  emit,
  EventKind,
  NO_BARRICADE,
  RoachMode,
  Role,
  type State,
} from './state.ts';

const place = (state: State, x: number, y: number, gen: number, immuneUntil: number): void => {
  state.freeCount -= 1;
  const slot = state.free[state.freeCount] ?? 0;
  const roaches = state.roaches;
  roaches.x[slot] = x;
  roaches.y[slot] = y;
  roaches.px[slot] = x;
  roaches.py[slot] = y;
  roaches.gen[slot] = gen;
  roaches.mode[slot] = RoachMode.Walking;
  roaches.heldBy[slot] = NO_BARRICADE;
  roaches.immuneUntil[slot] = immuneUntil;
  roaches.frozenUntil[slot] = 0;
  roaches.role[slot] = Role.Comrade;
  roaches.strayTicks[slot] = 0;
  roaches.alive[slot] = 1;
  roaches.id[slot] = state.nextId;
  state.nextId += 1;
  state.active += 1;
};

const enqueue = (state: State, gen: number): void => {
  state.queue[gen] = (state.queue[gen] ?? 0) + 1;
  state.queued += 1;
};

const enterAtMetro = (state: State, gen: number, immuneUntil: number): void => {
  const lane = LANES[nextInt(state.rng, LANE_COUNT)] ?? LANES[0];
  const jitter = lane?.jitter ?? 0;
  const x = (lane?.centerX ?? 0) + nextRange(state.rng, -jitter, jitter);
  place(state, subOf(x), subOf(METRO_Y), gen, immuneUntil);
};

export const metroHasRoom = (state: State): boolean => state.freeCount > FIELD_RESERVE;

export const spawnAtMetro = (state: State, gen: number, immuneUntil: number): void => {
  state.became += 1;
  if (!metroHasRoom(state)) {
    enqueue(state, gen);
    return;
  }
  enterAtMetro(state, gen, immuneUntil);
};

export const spawnAt = (state: State, x: number, y: number): void => {
  state.became += 1;
  if (state.freeCount === 0) {
    enqueue(state, 0);
    return;
  }
  place(state, subOf(x), subOf(y), 0, state.tick);
};

const isWaiting = (count: number): boolean => count > 0;

export const drainOne = (state: State): void => {
  const gen = state.queue.findIndex(isWaiting);
  state.queue[gen] = (state.queue[gen] ?? 0) - 1;
  state.queued -= 1;
  enterAtMetro(state, gen, state.tick + RESPAWN_IMMUNITY);
};

const release = (state: State, slot: number): void => {
  const barricade = state.roaches.heldBy[slot] ?? NO_BARRICADE;
  state.roaches.heldBy[slot] = NO_BARRICADE;
  if (state.roaches.mode[slot] !== RoachMode.Piled) return;
  state.barricades.pile[barricade] = (state.barricades.pile[barricade] ?? 0) - 1;
};

export const removeRoach = (state: State, slot: number): void => {
  release(state, slot);
  state.roaches.alive[slot] = 0;
  state.free[state.freeCount] = slot;
  state.freeCount += 1;
  state.active -= 1;
};

export const smashRoach = (state: State, slot: number, sympathy: number): void => {
  const roaches = state.roaches;
  const childGen = Math.min(MAX_GENERATION, (roaches.gen[slot] ?? 0) + 1);
  emit(state, EventKind.Smash, roaches.x[slot] ?? 0, roaches.y[slot] ?? 0, childGen);
  removeRoach(state, slot);
  state.smashes += 1;
  addSympathy(state, sympathy);
  state.lastSmashTick = state.tick;
  for (let child = 0; child < HYDRA_CHILDREN; child += 1) {
    spawnAtMetro(state, childGen, state.tick + RESPAWN_IMMUNITY);
  }
};

export const joinAt = (state: State, x: number, y: number, count: number): void => {
  for (let i = 0; i < count; i += 1) {
    const dx = nextRange(state.rng, -JOINER_JITTER, JOINER_JITTER);
    const dy = nextRange(state.rng, -JOINER_JITTER, JOINER_JITTER);
    const cell = NEAREST_OPEN[cellOf(x + dx, y + dy)] ?? 0;
    spawnAt(
      state,
      (cell % GRID_COLS) * CELL + CELL / 2,
      Math.floor(cell / GRID_COLS) * CELL + CELL / 2,
    );
  }
};
