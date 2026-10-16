import { LIGHTS_MINUTE, MAX_ACTIVE, SUB, TICKS_PER_MINUTE, type State } from '@suc/sim';
import { drawBackdrop } from './backdrop.ts';
import { createEffects, drawEffects, ingestEvents } from './effects.ts';
import { PALETTE } from './palette.ts';
import type { Renderer } from './renderer.ts';
import { fitCanvas } from './viewport.ts';

const ROACH_RADIUS = 6;
const LIGHTS_TICK = LIGHTS_MINUTE * TICKS_PER_MINUTE;

export interface RenderOptions {
  readonly reducedMotion: () => boolean;
}

const context2d = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D is unavailable');
  return ctx;
};

const lerp = (from: number, to: number, alpha: number): number =>
  (from + (to - from) * alpha) / SUB;

const drawRoach = (
  ctx: CanvasRenderingContext2D,
  state: State,
  slot: number,
  alpha: number,
): void => {
  const { x, y, px, py, immuneUntil } = state.roaches;
  ctx.fillStyle = (immuneUntil[slot] ?? 0) > state.tick ? PALETTE.immune : PALETTE.roach;
  ctx.beginPath();
  ctx.arc(
    lerp(px[slot] ?? 0, x[slot] ?? 0, alpha),
    lerp(py[slot] ?? 0, y[slot] ?? 0, alpha),
    ROACH_RADIUS,
    0,
    Math.PI * 2,
  );
  ctx.fill();
};

const drawRoaches = (ctx: CanvasRenderingContext2D, state: State, alpha: number): void => {
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    if (state.roaches.alive[slot] === 1) drawRoach(ctx, state, slot, alpha);
  }
};

export const createCanvasRenderer = (
  canvas: HTMLCanvasElement,
  options: RenderOptions,
): Renderer => {
  const ctx = context2d(canvas);
  const backdrop = document.createElement('canvas');
  const backdropCtx = context2d(backdrop);
  const effects = createEffects();
  let scale = 1;
  let archLit = false;

  const paintBackdrop = (): void => {
    backdrop.width = canvas.width;
    backdrop.height = canvas.height;
    backdropCtx.setTransform(scale, 0, 0, scale, 0, 0);
    drawBackdrop(backdropCtx, archLit);
  };

  const resize = (): void => {
    scale = fitCanvas(canvas);
    paintBackdrop();
  };

  const syncLights = (state: State): void => {
    const lit = state.tick >= LIGHTS_TICK;
    if (lit === archLit) return;
    archLit = lit;
    paintBackdrop();
  };

  const draw = (state: State, alpha: number, now: number): void => {
    syncLights(state);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(backdrop, 0, 0);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawRoaches(ctx, state, alpha);
    drawEffects(ctx, effects, now, options.reducedMotion());
  };

  resize();
  return {
    resize,
    ingest: (state, now) => {
      ingestEvents(effects, state, now);
    },
    draw,
  };
};
