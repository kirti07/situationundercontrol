import { VIEW } from '../content/tuning.ts';
import type { Level } from '../core/level.ts';
import { COLOR, STAMP_FONT, TAG_FONT } from './palette.ts';
import { isReady, type Sprites } from './sprites.ts';

const PX = 16;
const CROWD = 27;
const DEPTH = 3;
const WALK_TICKS = 70;
const BANNER_AT = 50;
const CROWD_HEIGHT = 15;
const PLACARD_EVERY = 3;

const ease = (t: number): number => 1 - (1 - t) ** 3;

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

const drawMarcher = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  feet: number,
  flip: boolean,
): void => {
  const width = (CROWD_HEIGHT * image.naturalWidth) / image.naturalHeight;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(feet));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(image, -width / 2, -CROWD_HEIGHT, width, CROWD_HEIGHT);
  ctx.restore();
};

const drawPlacard = (
  ctx: CanvasRenderingContext2D,
  x: number,
  feet: number,
  text: string,
  lift: number,
): void => {
  ctx.font = TAG_FONT;
  const width = Math.ceil(ctx.measureText(text).width) + 6;
  const top = feet - CROWD_HEIGHT - 12 - lift;
  ctx.fillStyle = COLOR.steel;
  ctx.fillRect(Math.round(x), top + 7, 1, 6 + lift);
  ctx.fillStyle = COLOR.white;
  ctx.fillRect(Math.round(x - width / 2), top, width, 8);
  ctx.strokeStyle = COLOR.ink;
  ctx.strokeRect(Math.round(x - width / 2) + 0.5, top + 0.5, width - 1, 7);
  ctx.fillStyle = COLOR.ink;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, top + 6);
  ctx.textAlign = 'left';
};

const drawBanner = (ctx: CanvasRenderingContext2D, level: Level, alpha: number): void => {
  const centre = (VIEW.cols * PX) / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COLOR.flagSaffron;
  ctx.fillRect(centre - 80, 14, 160, 26);
  ctx.strokeStyle = COLOR.ink;
  ctx.strokeRect(centre - 79.5, 14.5, 159, 25);
  ctx.fillStyle = COLOR.ink;
  ctx.textAlign = 'center';
  ctx.font = STAMP_FONT;
  ctx.fillText('POINT OF PROTEST', centre, 27);
  ctx.font = TAG_FONT;
  ctx.fillText(level.name, centre, 36);
  ctx.restore();
};

interface Scene {
  readonly ctx: CanvasRenderingContext2D;
  readonly image: HTMLImageElement;
  readonly feet: number;
  readonly gate: number;
  readonly elapsed: number;
  readonly placards: readonly string[];
}

const drawOne = (scene: Scene, index: number): void => {
  const depth = index % DEPTH;
  const rank = Math.floor(index / DEPTH);
  const target = scene.gate - 10 - rank * 11 - depth * 5;
  const progress = ease(clamp((scene.elapsed - index * 2) / WALK_TICKS));
  const start = -20 - index * 7;
  const x = start + (target - start) * progress;
  const arrived = progress === 1;
  const hop = arrived ? 0 : Math.abs(Math.sin((scene.elapsed + index * 3) / 4)) * 2;
  drawMarcher(scene.ctx, scene.image, x, scene.feet - depth * 2 - hop, arrived && index % 2 === 0);
  if (!arrived || depth !== 0 || rank % PLACARD_EVERY !== 0) return;
  const slot = rank / PLACARD_EVERY;
  const text = scene.placards[slot % scene.placards.length] ?? '';
  drawPlacard(scene.ctx, x, scene.feet, text, (slot % 2) * 10);
};

export const drawProtest = (
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  level: Level,
  camera: number,
  elapsed: number,
  placards: readonly string[],
): void => {
  const image = sprites.art('crowd');
  if (!isReady(image)) return;
  const scene: Scene = {
    ctx,
    image,
    feet: (level.exit.row + 1) * PX,
    gate: (level.exit.col - camera) * PX,
    elapsed,
    placards,
  };
  for (let index = CROWD - 1; index >= 0; index -= 1) drawOne(scene, index);
  drawBanner(ctx, level, clamp((elapsed - BANNER_AT) / 20));
};
