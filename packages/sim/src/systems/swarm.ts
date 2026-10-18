import {
  ACT_MINUTE,
  PERFECT_SIT_IN_JOINERS,
  PERFECT_SIT_IN_SURGE,
  PERFECT_SIT_IN_SYMPATHY,
  SIT_IN_CHARGE,
  SIT_IN_DURATION,
  SIT_IN_SYMPATHY,
  SUB,
  TICKS_PER_MINUTE,
} from '../config.ts';
import { solveField } from '../flow.ts';
import type { Input } from '../input.ts';
import { cellOf, NEAREST_OPEN } from '../map.ts';
import { joinAt } from '../roaches.ts';
import { addSympathy, emit, EventKind, NOT_SCHEDULED, Side, surge, type State } from '../state.ts';

const ACT_TICK = ACT_MINUTE * TICKS_PER_MINUTE;
const STEERING_POINTER = 0;

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

const stampWarning = (state: State): boolean => state.stamp.landsAt !== NOT_SCHEDULED;

const joinAtStamp = (state: State): void => {
  const { stamp } = state;
  joinAt(state, Math.floor(stamp.x / SUB), Math.floor(stamp.y / SUB), PERFECT_SIT_IN_JOINERS);
  emit(state, EventKind.PerfectSitIn, stamp.x, stamp.y, PERFECT_SIT_IN_JOINERS);
  surge(state, PERFECT_SIT_IN_SURGE);
};

export const sitIn = (state: State): void => {
  if (!sitInReady(state)) return;
  const perfect = stampWarning(state);
  state.timers.sitInUntil = state.tick + SIT_IN_DURATION;
  state.timers.sitInReadyAt = state.tick + SIT_IN_CHARGE;
  addSympathy(state, perfect ? PERFECT_SIT_IN_SYMPATHY : SIT_IN_SYMPATHY);
  emit(state, EventKind.SitIn, 0, 0, SIT_IN_DURATION);
  if (perfect) joinAtStamp(state);
};
