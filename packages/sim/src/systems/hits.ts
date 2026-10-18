import { MAX_ACTIVE } from '../config.ts';
import { smashRoach } from '../roaches.ts';
import type { State } from '../state.ts';

const smashable = (state: State, slot: number): boolean =>
  state.roaches.alive[slot] === 1 && (state.roaches.immuneUntil[slot] ?? 0) <= state.tick;

const within = (
  state: State,
  slot: number,
  x: number,
  y: number,
  radiusSquared: number,
): boolean => {
  const dx = (state.roaches.x[slot] ?? 0) - x;
  const dy = (state.roaches.y[slot] ?? 0) - y;
  return dx * dx + dy * dy <= radiusSquared;
};

export interface Strike {
  readonly x: number;
  readonly y: number;
  readonly radiusSquared: number;
  readonly sympathy: number;
}

export const smashWithin = (state: State, strike: Strike): number => {
  const { x, y, radiusSquared } = strike;
  let hits = 0;
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    if (smashable(state, slot) && within(state, slot, x, y, radiusSquared)) {
      state.scratch[hits] = slot;
      hits += 1;
    }
  }
  for (let i = 0; i < hits; i += 1) {
    smashRoach(state, state.scratch[i] ?? 0, strike.sympathy);
  }
  return hits;
};
