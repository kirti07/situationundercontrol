import type { CAUGHT_LABEL } from '../content/copy.ts';
import { COCKROACH, type Mods } from '../content/roles.ts';
import { ENERGY, PATROL, PLAYER, RULES, TILE } from '../content/tuning.ts';
import type { Cell, Level } from './level.ts';
import type { Body } from './physics.ts';
import { nextRandom } from './rng.ts';

export type Phase = 'play' | 'caught' | 'clear' | 'over';
export type Cause = keyof typeof CAUGHT_LABEL;
export type Facing = 1 | -1;

export interface PlayerState extends Body {
  grounded: boolean;
  coyote: number;
  buffer: number;
  jumpHeld: boolean;
  facing: Facing;
}

export interface PatrolState {
  x: number;
  readonly y: number;
  dir: Facing;
  energy: number;
  sleep: number;
}

export interface Carry {
  readonly lives: number;
  readonly score: number;
}

export interface RunState {
  readonly level: Level;
  readonly player: PlayerState;
  readonly patrols: PatrolState[];
  readonly collected: boolean[];
  readonly refillsTaken: boolean[];
  readonly mods: Mods;
  tick: number;
  exitOpen: boolean;
  lives: number;
  score: number;
  caughtThisLevel: number;
  phase: Phase;
  phaseTicks: number;
  cause: Cause | undefined;
  energy: number;
  dozing: number;
}

export const NEW_RUN: Carry = { lives: RULES.lives, score: 0 };

const standingAt = (cell: Cell, width: number, height: number): { x: number; y: number } => ({
  x: cell.col * TILE + (TILE - width) / 2,
  y: (cell.row + 1) * TILE - height,
});

export const placePlayer = (player: PlayerState, start: Cell): void => {
  Object.assign(player, standingAt(start, PLAYER.width, PLAYER.height), {
    vx: 0,
    vy: 0,
    grounded: false,
    coyote: 0,
    buffer: 0,
    facing: 1,
  });
};

const createPlayer = (start: Cell): PlayerState => {
  const player: PlayerState = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    grounded: false,
    coyote: 0,
    buffer: 0,
    jumpHeld: false,
    facing: 1,
  };
  placePlayer(player, start);
  return player;
};

const createPatrols = (cells: readonly Cell[], seed: number): PatrolState[] => {
  let random = seed;
  return cells.map((cell) => {
    random = nextRandom(random);
    return {
      ...standingAt(cell, PATROL.width, PATROL.height),
      dir: random % 2 === 0 ? 1 : -1,
      energy: PATROL.energyMax - (random % PATROL.tiredBelow),
      sleep: 0,
    };
  });
};

export const createRun = (
  level: Level,
  carry: Carry = NEW_RUN,
  seed = 1,
  mods: Mods = COCKROACH.mods,
): RunState => ({
  level,
  mods,
  player: createPlayer(level.start),
  patrols: createPatrols(level.patrols, seed),
  collected: level.collectibles.map(() => false),
  refillsTaken: level.refills.map(() => !mods.energy),
  tick: 0,
  exitOpen: false,
  lives: carry.lives,
  score: carry.score,
  caughtThisLevel: 0,
  phase: 'play',
  phaseTicks: 0,
  cause: undefined,
  energy: ENERGY.max,
  dozing: 0,
});
