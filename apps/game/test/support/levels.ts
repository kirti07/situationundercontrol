import { type Level, parseLevel } from '../../src/core/level.ts';
import type { Input } from '../../src/core/player.ts';
import { createRun, type RunState } from '../../src/core/state.ts';
import { type RunEvent, step } from '../../src/core/step.ts';

export const levelOf = (rows: readonly string[]): Level =>
  parseLevel({ id: 'test', name: 'TEST', maps: { cockroach: rows, agency: rows } }, 'cockroach');

export const runOf = (rows: readonly string[]): RunState => createRun(levelOf(rows));

export const play = (state: RunState, input: Input, ticks: number): RunEvent[] =>
  Array.from({ length: ticks }, () => step(state, input)).flat();

export const RIGHT: Input = { move: 1, jump: false };
export const LEFT: Input = { move: -1, jump: false };
export const JUMP: Input = { move: 0, jump: true };
