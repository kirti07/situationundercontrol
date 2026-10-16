import { MAX_ACTIVE, SUB, type State } from '@suc/sim';
import type { Art, Frame } from './art.ts';
import { PALETTE } from './palette.ts';
import { at } from './typed.ts';

const HEIGHT = 30;
const BOB = 1.4;
const BOB_SPEED = 90;
const FRESH_ALPHA = 0.6;
const SHADOW = 'rgba(0, 0, 0, 0.35)';
const SPREAD_X = 11;
const SPREAD_Y = 7;

interface Pose {
  x: number;
  y: number;
  bob: number;
  facing: number;
  frame: Frame | undefined;
  frozen: boolean;
  fresh: boolean;
}

export interface RoachPainter {
  readonly draw: (state: State, alpha: number, now: number) => void;
}

const spread = (id: number, prime: number, range: number): number =>
  ((id * prime) % range) - Math.floor(range / 2);

const lerp = (from: number, to: number, alpha: number): number =>
  (from + (to - from) * alpha) / SUB;

export const createRoachPainter = (
  ctx: CanvasRenderingContext2D,
  art: Art,
  scale: () => number,
  reducedMotion: () => boolean,
): RoachPainter => {
  const facing = new Int8Array(MAX_ACTIVE).fill(1);
  const pose: Pose = {
    x: 0,
    y: 0,
    bob: 0,
    facing: 1,
    frame: undefined,
    frozen: false,
    fresh: false,
  };

  const face = (slot: number, dx: number): number => {
    facing[slot] = dx === 0 ? at(facing, slot) : Math.sign(dx);
    return at(facing, slot);
  };

  const bobOf = (moving: boolean, id: number, now: number): number =>
    moving && !reducedMotion() ? Math.abs(Math.sin(now / BOB_SPEED + id)) * BOB : 0;

  const measure = (state: State, slot: number, alpha: number, now: number): Pose => {
    const { x, y, px, py, id, immuneUntil, frozenUntil } = state.roaches;
    const dx = at(x, slot) - at(px, slot);
    const dy = at(y, slot) - at(py, slot);
    const roachId = at(id, slot);
    pose.bob = bobOf(dx !== 0 || dy !== 0, roachId, now);
    pose.x = lerp(at(px, slot), at(x, slot), alpha) + spread(roachId, 37, SPREAD_X);
    pose.y = lerp(at(py, slot), at(y, slot), alpha) + spread(roachId, 53, SPREAD_Y);
    pose.facing = face(slot, dx);
    pose.frame = art.frames[roachId % art.frames.length];
    pose.frozen = at(frozenUntil, slot) > state.tick;
    pose.fresh = at(immuneUntil, slot) > state.tick;
    return pose;
  };

  const paint = (current: Pose, s: number): void => {
    const frame = current.frame;
    if (!frame) return;
    const width = (frame.w / frame.h) * HEIGHT;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.fillStyle = current.frozen ? PALETTE.frozen : SHADOW;
    ctx.beginPath();
    ctx.ellipse(current.x, current.y + 1, width * 0.32, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = current.fresh ? FRESH_ALPHA : 1;
    ctx.setTransform(s * current.facing, 0, 0, s, current.x * s, (current.y - current.bob) * s);
    ctx.drawImage(
      art.roaches,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      -width / 2,
      -HEIGHT,
      width,
      HEIGHT,
    );
    ctx.globalAlpha = 1;
  };

  return {
    draw: (state, alpha, now) => {
      const s = scale();
      for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
        if (state.roaches.alive[slot] === 1) paint(measure(state, slot, alpha, now), s);
      }
      ctx.setTransform(s, 0, 0, s, 0, 0);
    },
  };
};
