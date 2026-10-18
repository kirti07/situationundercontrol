import {
  CLIMB_SPEED_DENOMINATOR,
  CLIMB_SPEED_NUMERATOR,
  MAX_ACTIVE,
  SPEED_BY_GENERATION,
} from '../config.ts';
import { ARCH_FIELD, direction, type FlowField } from '../flow.ts';
import { cellOfSub, isPassableSub } from '../map.ts';
import { following, pacedSpeed, paceOf, trackStray } from '../pace.ts';
import { modeOf, RoachMode, sitInActive, type Roaches, type State } from '../state.ts';

const SPEED_BY_MODE: Readonly<Record<RoachMode, (speed: number) => number>> = {
  [RoachMode.Walking]: (speed) => speed,
  [RoachMode.Piled]: () => 0,
  [RoachMode.Climbing]: (speed) =>
    Math.floor((speed * CLIMB_SPEED_NUMERATOR) / CLIMB_SPEED_DENOMINATOR),
};

const scaled = (speed: number, component: number): number => Math.trunc((speed * component) / 256);

const settle = (roaches: Roaches, slot: number, nx: number, ny: number): void => {
  const x = roaches.x[slot] ?? 0;
  const y = roaches.y[slot] ?? 0;
  if (isPassableSub(nx, ny)) {
    roaches.x[slot] = nx;
    roaches.y[slot] = ny;
    return;
  }
  if (isPassableSub(nx, y)) {
    roaches.x[slot] = nx;
    return;
  }
  if (isPassableSub(x, ny)) roaches.y[slot] = ny;
};

const passedFinger = (state: State, cell: number): boolean =>
  (ARCH_FIELD.dist[cell] ?? 0) <= (ARCH_FIELD.dist[state.steering.cell] ?? 0);

const fieldFor = (state: State, slot: number, cell: number): FlowField =>
  following(state, slot) && !passedFinger(state, cell) ? state.steering.field : ARCH_FIELD;

const advance = (state: State, slot: number): void => {
  const { roaches } = state;
  if ((roaches.frozenUntil[slot] ?? 0) > state.tick) return;
  const x = roaches.x[slot] ?? 0;
  const y = roaches.y[slot] ?? 0;
  const cell = cellOfSub(x, y);
  const heading = direction(fieldFor(state, slot, cell).dir[cell] ?? 0);
  const base = SPEED_BY_GENERATION[roaches.gen[slot] ?? 0] ?? 0;
  const speed = SPEED_BY_MODE[modeOf(state, slot)](pacedSpeed(base, paceOf(state, slot)));
  settle(roaches, slot, x + scaled(speed, heading.dx), y + scaled(speed, heading.dy));
};

export const moveSystem = (state: State): void => {
  const { roaches } = state;
  roaches.px.set(roaches.x);
  roaches.py.set(roaches.y);
  if (sitInActive(state)) return;
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    if (roaches.alive[slot] !== 1) continue;
    trackStray(state, slot);
    advance(state, slot);
  }
};
