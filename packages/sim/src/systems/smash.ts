import {
  LATHI_REFILL,
  ON_CAMERA_SYMPATHY,
  SMASH_SYMPATHY,
  SUB,
  TAP_COOLDOWN,
  TAP_RADIUS,
} from '../config.ts';
import type { Input } from '../input.ts';
import { CAMERA_CELLS, cellOfSub, subOf } from '../map.ts';
import { emit, EventKind, NOT_SCHEDULED, Side, silenced, type State } from '../state.ts';
import { smashWithin } from './hits.ts';
import { accuse } from './momentAnswers.ts';

const RADIUS_SQUARED = TAP_RADIUS * SUB * (TAP_RADIUS * SUB);
const SYMPATHY_BY_CAMERA: readonly number[] = [SMASH_SYMPATHY, ON_CAMERA_SYMPATHY];

const readyToSmash = (state: State, pointer: number): boolean =>
  state.tick - (state.lastTap[pointer] ?? state.tick) >= TAP_COOLDOWN;

const spendLathi = (state: State): void => {
  state.lathis -= 1;
  const { timers } = state;
  if (timers.lathiRefillAt === NOT_SCHEDULED) timers.lathiRefillAt = state.tick + LATHI_REFILL;
};

const smash = (state: State, input: Input): void => {
  if (!readyToSmash(state, input.pointer)) return;
  state.lastTap[input.pointer] = state.tick;
  const x = subOf(input.x);
  const y = subOf(input.y);
  if (silenced(state)) {
    emit(state, EventKind.Muted, x, y, 0);
    return;
  }
  if (state.lathis === 0) {
    emit(state, EventKind.Empty, x, y, 0);
    return;
  }
  spendLathi(state);
  const filmed = CAMERA_CELLS[cellOfSub(x, y)] ?? 0;
  const sympathy = SYMPATHY_BY_CAMERA[filmed] ?? SMASH_SYMPATHY;
  const hits = smashWithin(state, { x, y, radiusSquared: RADIUS_SQUARED, sympathy });
  emit(state, EventKind.Tap, x, y, hits);
  if (hits > 0 && filmed === 1) emit(state, EventKind.Filmed, x, y, hits);
};

const TAP_BY_SIDE: Readonly<Record<Side, (state: State, input: Input) => void>> = {
  [Side.Agency]: smash,
  [Side.Cockroach]: accuse,
};

export const tap = (state: State, input: Input): void => {
  TAP_BY_SIDE[state.side](state, input);
};
