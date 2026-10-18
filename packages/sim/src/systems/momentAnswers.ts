import {
  CAUGHT_SURGE,
  CAUGHT_SYMPATHY,
  MAX_ACTIVE,
  PLACARD_JOIN_Y,
  PLACARD_JOINERS,
  PLACARD_RIGHT_SYMPATHY,
  PLACARD_SURGE,
  PLACARD_WRONG_SYMPATHY,
  WRONG_ACCUSE_LEAVERS,
} from '../config.ts';
import type { Input } from '../input.ts';
import { LANES, LAWN_LANES, subOf } from '../map.ts';
import { joinAt, removeRoach } from '../roaches.ts';
import {
  addSympathy,
  emit,
  EventKind,
  MomentKind,
  Outcome,
  Role,
  Side,
  type State,
  surge,
} from '../state.ts';
import {
  ACCUSE_SQUARED,
  close,
  distanceSquared,
  fakeAlive,
  fakeSlot,
  LEAVER_SQUARED,
  nearestRoach,
  NONE,
} from './momentCore.ts';

const catchFake = (state: State, slot: number): void => {
  const x = state.roaches.x[slot] ?? 0;
  const y = state.roaches.y[slot] ?? 0;
  removeRoach(state, slot);
  addSympathy(state, CAUGHT_SYMPATHY);
  surge(state, CAUGHT_SURGE);
  state.stamp.calledOff = true;
  emit(state, EventKind.Caught, x, y, 0);
  close(state, Outcome.Won);
};

const answerPlacard = (state: State, option: number): void => {
  if (option > 1) return;
  const right = option === state.moment.cards[1];
  addSympathy(state, right ? PLACARD_RIGHT_SYMPATHY : PLACARD_WRONG_SYMPATHY);
  const lawn = LANES[LAWN_LANES[option] ?? 0];
  if (right) {
    joinAt(state, lawn?.centerX ?? 0, PLACARD_JOIN_Y, PLACARD_JOINERS);
    surge(state, PLACARD_SURGE);
  }
  close(state, right ? Outcome.Won : Outcome.Lost);
};

const ANSWERS: Readonly<Record<MomentKind, (state: State, option: number) => void>> = {
  [MomentKind.None]: () => undefined,
  [MomentKind.Fake]: () => undefined,
  [MomentKind.Placard]: answerPlacard,
};

export const answerMoment = (state: State, input: Input): void => {
  if (state.side !== Side.Cockroach) return;
  ANSWERS[state.moment.kind](state, input.x);
};

const sendHome = (state: State, around: number): void => {
  const x = state.roaches.x[around] ?? 0;
  const y = state.roaches.y[around] ?? 0;
  let left = 0;
  for (let slot = 0; slot < MAX_ACTIVE && left < WRONG_ACCUSE_LEAVERS; slot += 1) {
    const leaves =
      state.roaches.alive[slot] === 1 &&
      state.roaches.role[slot] === Role.Comrade &&
      distanceSquared(state, slot, x, y) <= LEAVER_SQUARED;
    if (!leaves) continue;
    removeRoach(state, slot);
    left += 1;
  }
  emit(state, EventKind.WrongAccuse, x, y, left);
};

const tappedFake = (state: State, x: number, y: number): boolean =>
  fakeAlive(state) && distanceSquared(state, fakeSlot(state), x, y) <= ACCUSE_SQUARED;

export const accuse = (state: State, input: Input): void => {
  if (state.moment.kind !== MomentKind.Fake) return;
  const x = subOf(input.x);
  const y = subOf(input.y);
  if (tappedFake(state, x, y)) {
    catchFake(state, fakeSlot(state));
    return;
  }
  const slot = nearestRoach(state, x, y);
  if (slot !== NONE) sendHome(state, slot);
};
