import { MAX_ACTIVE } from './config.ts';
import type { State } from './state.ts';

const mix = (hash: number, value: number): number => Math.imul(hash ^ (value | 0), 0x01000193);

export const hashState = (state: State): number => {
  const counters = [
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
  ];
  let hash = counters.reduce(mix, 0x811c9dc5);
  const roaches = state.roaches;
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    const alive = roaches.alive[slot] ?? 0;
    hash = mix(hash, alive * (roaches.id[slot] ?? 0));
    hash = mix(hash, alive * (roaches.x[slot] ?? 0));
    hash = mix(hash, alive * (roaches.y[slot] ?? 0));
    hash = mix(hash, alive * (roaches.gen[slot] ?? 0));
  }
  return hash >>> 0;
};
