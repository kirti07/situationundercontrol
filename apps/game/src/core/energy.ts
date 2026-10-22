import { ENERGY, PLAYER } from '../content/tuning.ts';
import { IDLE, type Input, type Speeds } from './player.ts';
import type { RunState } from './state.ts';

const isTiredPlayer = (state: RunState): boolean =>
  state.mods.energy && state.energy < ENERGY.tiredBelow;

export const speedsOf = (state: RunState): Speeds => {
  const tired = isTiredPlayer(state);
  return {
    run: tired ? ENERGY.tiredRunSpeed : PLAYER.runSpeed,
    jump: tired ? ENERGY.tiredJumpSpeed : PLAYER.jumpSpeed,
    maxFall: state.mods.maxFall,
  };
};

export interface Spent {
  readonly input: Input;
  readonly dozed: boolean;
}

const doze = (state: RunState): Spent => {
  state.dozing -= 1;
  if (state.dozing === 0) state.energy = ENERGY.wakeEnergy;
  return { input: IDLE, dozed: false };
};

export const spendEnergy = (state: RunState, input: Input): Spent => {
  if (!state.mods.energy) return { input, dozed: false };
  if (state.dozing > 0) return doze(state);
  if (input.move !== 0) state.energy -= 1;
  if (state.energy > 0) return { input, dozed: false };
  state.dozing = ENERGY.dozeTicks;
  return { input: IDLE, dozed: true };
};

export const refill = (state: RunState): void => {
  state.energy = Math.min(ENERGY.max, state.energy + ENERGY.refill);
};
