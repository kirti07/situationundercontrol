import {
  CAUGHT_SYMPATHY,
  FAKE_TELLS,
  FAKE_WINDOW,
  FIRST_MOMENT_WINDOW,
  MAX_ACTIVE,
  MOMENT_WINDOW,
  PLACARD_PAIRS,
} from '../config.ts';
import { nextInt } from '../rng.ts';
import { removeRoach } from '../roaches.ts';
import {
  addSympathy,
  emit,
  EventKind,
  MomentKind,
  NO_ANSWER,
  Outcome,
  Role,
  Side,
  type State,
} from '../state.ts';
import { close, fakeAlive, fakeSlot, NONE, phaseAt } from './momentCore.ts';

const DRAW_BOUND = 32768;
const DRAWS = 2;

type Opener = (state: State, draws: readonly number[]) => boolean;

const randomComrade = (state: State): number => {
  if (state.active === 0) return NONE;
  let skip = nextInt(state.rng, state.active);
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    if (state.roaches.alive[slot] !== 1) continue;
    if (skip === 0) return slot;
    skip -= 1;
  }
  return NONE;
};

const openFake: Opener = (state, draws) => {
  const slot = randomComrade(state);
  if (slot === NONE) return false;
  state.roaches.role[slot] = Role.Fake;
  state.moment.cards.set([(draws[0] ?? 0) % FAKE_TELLS, slot]);
  return true;
};

const openPlacard: Opener = (state, draws) => {
  state.moment.cards.set([(draws[0] ?? 0) % PLACARD_PAIRS, (draws[1] ?? 0) % 2]);
  return true;
};

const OPENERS: Readonly<Record<MomentKind, Opener>> = {
  [MomentKind.None]: () => false,
  [MomentKind.Fake]: openFake,
  [MomentKind.Placard]: openPlacard,
};

const windowFor = (state: State, kind: MomentKind): number => {
  if (kind === MomentKind.Fake) return FAKE_WINDOW;
  return state.moment.closed === 0 ? FIRST_MOMENT_WINDOW : MOMENT_WINDOW;
};

const open = (state: State, kind: MomentKind): void => {
  const { moment } = state;
  const draws = Array.from({ length: DRAWS }, () => nextInt(state.momentRng, DRAW_BOUND));
  moment.cards.fill(0);
  if (!OPENERS[kind](state, draws)) {
    moment.nextAt = state.tick + phaseAt(state.tick).gap;
    return;
  }
  moment.kind = kind;
  moment.opensAt = state.tick;
  moment.closesAt = state.tick + windowFor(state, kind);
  moment.answer = NO_ANSWER;
  emit(state, EventKind.MomentOpen, 0, 0, kind);
};

const leaveFake = (state: State): void => {
  if (fakeAlive(state)) removeRoach(state, fakeSlot(state));
};

const EXPIRERS: Readonly<Record<MomentKind, (state: State) => void>> = {
  [MomentKind.None]: () => undefined,
  [MomentKind.Fake]: (state) => {
    leaveFake(state);
    state.stamp.pinpointed = true;
    close(state, Outcome.Lost);
  },
  [MomentKind.Placard]: (state) => {
    close(state, Outcome.Ignored);
  },
};

const expire = (state: State): void => {
  const { moment } = state;
  if (moment.kind === MomentKind.None || state.tick < moment.closesAt) return;
  EXPIRERS[moment.kind](state);
};

const fakeStamped = (state: State): void => {
  if (state.moment.kind !== MomentKind.Fake || fakeAlive(state)) return;
  addSympathy(state, CAUGHT_SYMPATHY);
  emit(state, EventKind.Caught, 0, 0, 1);
  close(state, Outcome.Won);
};

const schedule = (state: State): void => {
  const { moment } = state;
  if (moment.kind !== MomentKind.None || state.tick < moment.nextAt) return;
  const { kinds } = phaseAt(state.tick);
  open(state, kinds[nextInt(state.momentRng, kinds.length)] ?? MomentKind.Placard);
};

export const momentsSystem = (state: State): void => {
  if (state.side !== Side.Cockroach) return;
  fakeStamped(state);
  expire(state);
  schedule(state);
};
