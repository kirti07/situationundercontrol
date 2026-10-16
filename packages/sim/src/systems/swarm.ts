import {
  ACT_MINUTE,
  SIT_IN_CHARGE,
  SIT_IN_DURATION,
  SIT_IN_SYMPATHY,
  SYMPATHY_MAX,
  TICKS_PER_MINUTE,
} from '../config.ts';
import { solveField } from '../flow.ts';
import type { Input } from '../input.ts';
import { cellOf, NEAREST_OPEN } from '../map.ts';
import { emit, EventKind, NOT_SCHEDULED, Side, type State } from '../state.ts';

const STEERING_POINTER = 0;
const ACT_TICK = ACT_MINUTE * TICKS_PER_MINUTE;

const steers = (state: State, input: Input): boolean =>
  state.side === Side.Cockroach && input.pointer === STEERING_POINTER;

export const steerTo = (state: State, input: Input): void => {
  if (!steers(state, input)) return;
  const cell = NEAREST_OPEN[cellOf(input.x, input.y)] ?? 0;
  const { steering } = state;
  if (cell === steering.cell) return;
  steering.goal.fill(0);
  steering.goal[cell] = 1;
  solveField(steering.field, steering.goal);
  steering.cell = cell;
};

export const steerEnd = (state: State, input: Input): void => {
  if (!steers(state, input)) return;
  state.steering.cell = NOT_SCHEDULED;
};

const sitInReady = (state: State): boolean =>
  state.side === Side.Cockroach &&
  state.tick >= ACT_TICK &&
  state.tick >= state.timers.sitInReadyAt;

export const sitIn = (state: State): void => {
  if (!sitInReady(state)) return;
  state.timers.sitInUntil = state.tick + SIT_IN_DURATION;
  state.timers.sitInReadyAt = state.tick + SIT_IN_CHARGE;
  state.sympathy = Math.min(SYMPATHY_MAX, state.sympathy + SIT_IN_SYMPATHY);
  state.peakSympathy = Math.max(state.peakSympathy, state.sympathy);
  emit(state, EventKind.SitIn, 0, 0, SIT_IN_DURATION);
};
