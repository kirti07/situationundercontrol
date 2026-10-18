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
  state.timers.lawnsPausedUntil,
  state.timers.sitInUntil,
  state.stamp.landsAt,
  state.lathis,
  state.timers.lathiRefillAt,
  state.timers.surgeUntil,
  state.moment.kind,
  state.moment.opensAt,
  state.moment.closesAt,
  state.moment.nextAt,
  state.moment.answer,
  state.steering.cell,
  state.moment.closed,
  state.moment.won,
  Number(state.stamp.calledOff),
  Number(state.stamp.pinpointed),
  Number(state.stamp.wide),
  ...state.moment.cards,
];

const BARRICADE_COLUMNS = ['lane', 'y', 'pile', 'expiresAt'] as const;

const mixColumn = (hash: number, column: Iterable<number>): number => {
  let current = hash;
  for (const value of column) current = mix(current, value);
  return current;
};

const mixBarricades = (state: State, hash: number): number =>
  BARRICADE_COLUMNS.reduce((current, column) => mixColumn(current, state.barricades[column]), hash);

const ROACH_COLUMNS = ['id', 'x', 'y', 'gen', 'mode', 'frozenUntil', 'role', 'strayTicks'] as const;

const mixRoach = (state: State, hash: number, slot: number): number => {
  const alive = state.roaches.alive[slot] ?? 0;
  return ROACH_COLUMNS.reduce(
    (current, column) => mix(current, alive * (state.roaches[column][slot] ?? 0)),
    hash,
  );
};

export const hashState = (state: State): number => {
  let hash = mixBarricades(state, counters(state).reduce(mix, 0x811c9dc5));
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    hash = mixRoach(state, hash, slot);
  }
  return hash >>> 0;
};
