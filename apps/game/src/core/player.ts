import { PLAYER } from '../content/tuning.ts';
import type { Level } from './level.ts';
import { moveBody, type Size } from './physics.ts';
import type { PlayerState } from './state.ts';

export interface Input {
  readonly move: -1 | 0 | 1;
  readonly jump: boolean;
}

export interface Speeds {
  readonly run: number;
  readonly jump: number;
  readonly maxFall: number;
}

export const IDLE: Input = { move: 0, jump: false };

const NORMAL_SPEEDS: Speeds = {
  run: PLAYER.runSpeed,
  jump: PLAYER.jumpSpeed,
  maxFall: PLAYER.maxFall,
};

export const PLAYER_SIZE: Size = { w: PLAYER.width, h: PLAYER.height };

const tick = (value: number): number => Math.max(0, value - 1);

const tryJump = (player: PlayerState, input: Input, speeds: Speeds): boolean => {
  player.buffer = input.jump && !player.jumpHeld ? PLAYER.bufferTicks : tick(player.buffer);
  player.coyote = player.grounded ? PLAYER.coyoteTicks : tick(player.coyote);
  player.jumpHeld = input.jump;
  if (player.buffer === 0 || player.coyote === 0) return false;
  player.vy = -speeds.jump;
  player.buffer = 0;
  player.coyote = 0;
  return true;
};

export const updatePlayer = (
  level: Level,
  player: PlayerState,
  input: Input,
  speeds: Speeds = NORMAL_SPEEDS,
): boolean => {
  player.vx = input.move * speeds.run;
  if (input.move !== 0) player.facing = input.move;
  const jumped = tryJump(player, input, speeds);
  if (!input.jump && player.vy < -PLAYER.releasedRise) player.vy = -PLAYER.releasedRise;
  player.vy = Math.min(player.vy + PLAYER.gravity, speeds.maxFall);
  player.grounded = moveBody(level, player, PLAYER_SIZE);
  return jumped;
};
