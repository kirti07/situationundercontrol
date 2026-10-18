import { LIGHTS_MINUTE, TICKS_PER_MINUTE, type Side, type State } from '@suc/sim';
import type { Art } from './art.ts';
import { drawBackdrop } from './backdrop.ts';
import { createEffects, type EffectLabels } from './effects.ts';
import { drawBarricades, drawSitIn, drawStampWarning } from './hazards.ts';
import type { Renderer } from './renderer.ts';
import { createRally } from './rally.ts';
import { createRoachPainter } from './roaches.ts';
import { fitCanvas } from './viewport.ts';

const LIGHTS_TICK = LIGHTS_MINUTE * TICKS_PER_MINUTE;

export interface RenderOptions {
  readonly art: Art;
  readonly labels: EffectLabels;
  readonly reducedMotion: () => boolean;
  readonly side: Side;
}

const context2d = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D is unavailable');
  return ctx;
};

export const createCanvasRenderer = (
  canvas: HTMLCanvasElement,
  options: RenderOptions,
): Renderer => {
  const ctx = context2d(canvas);
  const backdrop = document.createElement('canvas');
  const backdropCtx = context2d(backdrop);
  const effects = createEffects(options);
  const rally = createRally(options.side, options.reducedMotion);
  let scale = 1;
  let archLit = false;
  const roaches = createRoachPainter(ctx, options.art, () => scale, options.reducedMotion);

  const paintBackdrop = (): void => {
    backdrop.width = canvas.width;
    backdrop.height = canvas.height;
    backdropCtx.setTransform(scale, 0, 0, scale, 0, 0);
    drawBackdrop(backdropCtx, options.art, archLit, options.side);
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
    drawSitIn(ctx, state);
    drawStampWarning(ctx, state);
    drawBarricades(ctx, state);
    roaches.draw(state, alpha, now);
    rally.draw(ctx, state, now);
    effects.draw(ctx, now);
  };

  resize();
  return { resize, ingest: effects.ingest, draw };
};
