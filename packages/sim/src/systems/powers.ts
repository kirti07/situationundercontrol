import {
  BACKFIRE_DENOMINATOR,
  BACKFIRE_NUMERATOR,
  FREEZE_DURATION,
  FREEZE_RADIUS,
  MASTERSTROKE_Y,
  MAX_ACTIVE,
  POWER_CHARGE,
  SILENCE_DURATION,
  SUB,
} from '../config.ts';
import { raiseBarricade } from '../barricades.ts';
import { clusterCenterX, clusterCenterY, densestCluster, NO_CLUSTER } from '../density.ts';
import { LANE_COUNT, ROADS } from '../map.ts';
import { spawnAt } from '../roaches.ts';
import { Character, emit, EventKind, NOT_SCHEDULED, Side, type State } from '../state.ts';

const FREEZE_RADIUS_SQUARED = FREEZE_RADIUS * SUB * (FREEZE_RADIUS * SUB);

const withinFreeze = (state: State, slot: number, x: number, y: number): boolean => {
  const dx = (state.roaches.x[slot] ?? 0) - x;
  const dy = (state.roaches.y[slot] ?? 0) - y;
  return state.roaches.alive[slot] === 1 && dx * dx + dy * dy <= FREEZE_RADIUS_SQUARED;
};

const nationDemands = (state: State): void => {
  const cluster = densestCluster(state);
  if (cluster === NO_CLUSTER) return;
  const x = clusterCenterX(cluster);
  const y = clusterCenterY(cluster);
  let frozen = 0;
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    const hit = withinFreeze(state, slot, x, y);
    state.roaches.frozenUntil[slot] = hit
      ? state.tick + FREEZE_DURATION
      : (state.roaches.frozenUntil[slot] ?? 0);
    frozen += hit ? 1 : 0;
  }
  state.timers.frozenCount = frozen;
  state.timers.freezeEndsAt = state.tick + FREEZE_DURATION;
};

const masterstroke = (state: State): void => {
  for (let lane = 0; lane < LANE_COUNT; lane += 1) raiseBarricade(state, lane, MASTERSTROKE_Y);
};

const mannKiBaat = (state: State): void => {
  state.sympathy = 0;
  state.timers.silencedUntil = state.tick + SILENCE_DURATION;
};

const POWERS: Readonly<Record<Character, (state: State) => void>> = {
  [Character.None]: () => undefined,
  [Character.PrimeTime]: nationDemands,
  [Character.Chanakya]: masterstroke,
  [Character.PradhanSevak]: mannKiBaat,
};

export const usePower = (state: State): void => {
  if (state.side !== Side.Agency || state.tick < state.timers.powerReadyAt) return;
  state.timers.powerReadyAt = state.tick + POWER_CHARGE;
  POWERS[state.character](state);
  emit(state, EventKind.Power, 0, 0, state.character);
};

export const listenDown = (state: State): void => {
  if (state.side !== Side.Agency) return;
  state.timers.listenSince = state.tick;
};

export const listenUp = (state: State): void => {
  state.timers.listenSince = NOT_SCHEDULED;
};

const backfire = (state: State): void => {
  const { timers } = state;
  const count = Math.floor((timers.frozenCount * BACKFIRE_NUMERATOR) / BACKFIRE_DENOMINATOR);
  for (let i = 0; i < count; i += 1) {
    const road = ROADS[timers.roadCursor % ROADS.length] ?? { x: 0, y: 0 };
    spawnAt(state, road.x, road.y);
    timers.roadCursor += 1;
  }
  timers.freezeEndsAt = NOT_SCHEDULED;
  timers.frozenCount = 0;
  emit(state, EventKind.Backfire, 0, 0, count);
};

export const powersSystem = (state: State): void => {
  if (state.tick === state.timers.freezeEndsAt) backfire(state);
};
