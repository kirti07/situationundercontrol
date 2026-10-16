import { MAX_ACTIVE } from './config.ts';
import type { State } from './state.ts';

const mix = (hash: number, value: number): number => Math.imul(hash ^ (value | 0), 0x01000193);

const counters = (state: State): number[] => [
  state.tick,
  state.active,
  state.queued,
  state.control,
  state.sympathy,
  state.became,
  state.reached,
  state.smashes,
  state.endReason,
  state.endTick,
  state.nextId,
  state.timers.powerReadyAt,
  state.timers.freezeEndsAt,
  state.timers.silencedUntil,
  state.timers.sitInUntil,
  state.stamp.landsAt,
];

const ROACH_COLUMNS = ['id', 'x', 'y', 'gen', 'mode', 'frozenUntil'] as const;

const mixRoach = (state: State, hash: number, slot: number): number => {
  const alive = state.roaches.alive[slot] ?? 0;
  return ROACH_COLUMNS.reduce(
    (current, column) => mix(current, alive * (state.roaches[column][slot] ?? 0)),
    hash,
  );
};

export const hashState = (state: State): number => {
  let hash = counters(state).reduce(mix, 0x811c9dc5);
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    hash = mixRoach(state, hash, slot);
  }
  return hash >>> 0;
};
