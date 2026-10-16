import { SUB, TAP_COOLDOWN, TAP_RADIUS } from '../config.ts';
import type { Input } from '../input.ts';
import { subOf } from '../map.ts';
import { emit, EventKind, Side, type State } from '../state.ts';
import { smashWithin } from './hits.ts';

const RADIUS_SQUARED = TAP_RADIUS * SUB * (TAP_RADIUS * SUB);

const readyToSmash = (state: State, pointer: number): boolean =>
  state.side === Side.Agency && state.tick - (state.lastTap[pointer] ?? state.tick) >= TAP_COOLDOWN;

export const tap = (state: State, input: Input): void => {
  if (!readyToSmash(state, input.pointer)) return;
  state.lastTap[input.pointer] = state.tick;
  const x = subOf(input.x);
  const y = subOf(input.y);
  emit(state, EventKind.Tap, x, y, smashWithin(state, x, y, RADIUS_SQUARED));
};
