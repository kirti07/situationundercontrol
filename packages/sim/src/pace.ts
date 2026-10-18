import {
  CELL,
  CHANT_DENOMINATOR,
  CHANT_NUMERATOR,
  CHANT_RADIUS,
  FOLLOW_RADIUS,
  GRID_COLS,
  MARCH_DENOMINATOR,
  MARCH_NUMERATOR,
  MAX_ACTIVE,
  MAX_SPEED,
  STRAY_TICKS,
  SUB,
} from './config.ts';
import { NOT_SCHEDULED, Side, surging, type State } from './state.ts';

export const Pace = { Dawdle: 0, March: 1, Chant: 2 } as const;
export type Pace = (typeof Pace)[keyof typeof Pace];

const PACE_RATIO: Readonly<Record<Pace, readonly [number, number]>> = {
  [Pace.Dawdle]: [MARCH_NUMERATOR, MARCH_DENOMINATOR],
  [Pace.March]: [1, 1],
  [Pace.Chant]: [CHANT_NUMERATOR, CHANT_DENOMINATOR],
};

const squared = (units: number): number => units * SUB * (units * SUB);
const FOLLOW_SQUARED = squared(FOLLOW_RADIUS);
const CHANT_SQUARED = squared(CHANT_RADIUS);

const fingerDown = (state: State): boolean => state.steering.cell !== NOT_SCHEDULED;

const distanceToFinger = (state: State, slot: number): number => {
  const cell = state.steering.cell;
  const dx = (state.roaches.x[slot] ?? 0) - ((cell % GRID_COLS) * CELL + CELL / 2) * SUB;
  const dy = (state.roaches.y[slot] ?? 0) - (Math.floor(cell / GRID_COLS) * CELL + CELL / 2) * SUB;
  return dx * dx + dy * dy;
};

const leadPace = (state: State, slot: number): Pace => {
  if (surging(state)) return Pace.Chant;
  if (!fingerDown(state)) return Pace.Dawdle;
  if (distanceToFinger(state, slot) <= CHANT_SQUARED) return Pace.Chant;
  return (state.roaches.strayTicks[slot] ?? 0) > STRAY_TICKS ? Pace.Dawdle : Pace.March;
};

const SIDE_PACE: Readonly<Record<Side, (state: State, slot: number) => Pace>> = {
  [Side.Agency]: () => Pace.March,
  [Side.Cockroach]: leadPace,
};

export const paceOf = (state: State, slot: number): Pace => SIDE_PACE[state.side](state, slot);

export const following = (state: State, slot: number): boolean =>
  fingerDown(state) && (state.roaches.strayTicks[slot] ?? 0) <= STRAY_TICKS;

export const countPace = (state: State, pace: Pace): number => {
  let count = 0;
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    count += state.roaches.alive[slot] === 1 && paceOf(state, slot) === pace ? 1 : 0;
  }
  return count;
};

export const trackStray = (state: State, slot: number): void => {
  const near = fingerDown(state) && distanceToFinger(state, slot) <= FOLLOW_SQUARED;
  const stray = (state.roaches.strayTicks[slot] ?? 0) + 1;
  state.roaches.strayTicks[slot] = near || !fingerDown(state) ? 0 : stray;
};

export const pacedSpeed = (speed: number, pace: Pace): number => {
  const [numerator, denominator] = PACE_RATIO[pace];
  return Math.min(MAX_SPEED, Math.floor((speed * numerator) / denominator));
};
