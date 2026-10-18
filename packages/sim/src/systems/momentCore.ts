import {
  ACCUSE_RADIUS,
  ACT_MINUTE,
  LEAVER_RADIUS,
  MAX_ACTIVE,
  MOMENT_GAP,
  RUSH_MINUTE,
  RUSH_MOMENT_GAP,
  SUB,
  TICKS_PER_MINUTE,
} from '../config.ts';
import { emit, EventKind, MomentKind, momentResult, Outcome, Role, type State } from '../state.ts';

interface Phase {
  readonly fromMinute: number;
  readonly gap: number;
  readonly kinds: readonly MomentKind[];
}

const PHASES: readonly Phase[] = [
  { fromMinute: 0, gap: MOMENT_GAP, kinds: [MomentKind.Placard] },
  { fromMinute: ACT_MINUTE, gap: MOMENT_GAP, kinds: [MomentKind.Fake, MomentKind.Placard] },
  { fromMinute: RUSH_MINUTE, gap: RUSH_MOMENT_GAP, kinds: [MomentKind.Fake, MomentKind.Placard] },
];

export const ACCUSE_SQUARED = ACCUSE_RADIUS * SUB * (ACCUSE_RADIUS * SUB);
export const LEAVER_SQUARED = LEAVER_RADIUS * SUB * (LEAVER_RADIUS * SUB);
export const NONE = -1;

export const phaseAt = (tick: number): Phase => {
  const minute = Math.floor(tick / TICKS_PER_MINUTE);
  return PHASES.reduce((current, phase) => (minute >= phase.fromMinute ? phase : current));
};

export const distanceSquared = (state: State, slot: number, x: number, y: number): number => {
  const dx = (state.roaches.x[slot] ?? 0) - x;
  const dy = (state.roaches.y[slot] ?? 0) - y;
  return dx * dx + dy * dy;
};

const nearestComrade = (state: State, x: number, y: number, limit: number): number => {
  let best = NONE;
  let bestDistance = limit;
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    const distance = distanceSquared(state, slot, x, y);
    const candidate = state.roaches.alive[slot] === 1 && distance <= bestDistance;
    best = candidate ? slot : best;
    bestDistance = candidate ? distance : bestDistance;
  }
  return best;
};

export const nearestRoach = (state: State, x: number, y: number): number =>
  nearestComrade(state, x, y, ACCUSE_SQUARED);

export const fakeSlot = (state: State): number => state.moment.cards[1] ?? NONE;

export const fakeAlive = (state: State): boolean => {
  const slot = fakeSlot(state);
  return state.roaches.alive[slot] === 1 && state.roaches.role[slot] === Role.Fake;
};

export const close = (state: State, outcome: Outcome): void => {
  const { moment } = state;
  emit(state, EventKind.MomentResult, 0, 0, momentResult(moment.kind, outcome));
  moment.closed += 1;
  moment.won += outcome === Outcome.Won ? 1 : 0;
  moment.kind = MomentKind.None;
  moment.nextAt = state.tick + phaseAt(state.tick).gap;
};
