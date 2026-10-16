import { MAX_ACTIVE, SUB, TAP_COOLDOWN, TAP_RADIUS } from '../config.ts';
import type { Input } from '../input.ts';
import { subOf } from '../map.ts';
import { smashRoach } from '../roaches.ts';
import { emit, EventKind, Side, type State } from '../state.ts';

const RADIUS_SQUARED = TAP_RADIUS * SUB * (TAP_RADIUS * SUB);

const readyToSmash = (state: State, pointer: number): boolean =>
  state.side === Side.Agency && state.tick - (state.lastTap[pointer] ?? state.tick) >= TAP_COOLDOWN;

const smashable = (state: State, slot: number): boolean =>
  state.roaches.alive[slot] === 1 && (state.roaches.immuneUntil[slot] ?? 0) <= state.tick;

const within = (state: State, slot: number, x: number, y: number): boolean => {
  const dx = (state.roaches.x[slot] ?? 0) - x;
  const dy = (state.roaches.y[slot] ?? 0) - y;
  return dx * dx + dy * dy <= RADIUS_SQUARED;
};

const collectHits = (state: State, x: number, y: number): number => {
  let hits = 0;
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    if (smashable(state, slot) && within(state, slot, x, y)) {
      state.scratch[hits] = slot;
      hits += 1;
    }
  }
  return hits;
};

export const tap = (state: State, input: Input): void => {
  if (!readyToSmash(state, input.pointer)) return;
  state.lastTap[input.pointer] = state.tick;
  const x = subOf(input.x);
  const y = subOf(input.y);
  const hits = collectHits(state, x, y);
  for (let i = 0; i < hits; i += 1) {
    smashRoach(state, state.scratch[i] ?? 0);
  }
  emit(state, EventKind.Tap, x, y, hits);
};
