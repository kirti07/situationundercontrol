import { VIEW } from '../content/tuning.ts';
import { type BurnRun, type Heat, heatOf } from '../core/burn.ts';
import { type Level, Tile, tileAt } from '../core/level.ts';
import type { RunState } from '../core/state.ts';
import { COLOR, TAG_FONT } from './palette.ts';
import { type HazardName, isReady, type Sprites } from './sprites.ts';

const PX = 16;
const STONE = 6;
type Crop = readonly [x0: number, y0: number, x1: number, y1: number];

const HAZARD_TILES: Readonly<Partial<Record<number, HazardName>>> = {
  [Tile.fire]: 'fire',
  [Tile.river]: 'river',
  [Tile.pothole]: 'pothole',
  [Tile.smog]: 'smog',
};

interface Run {
  readonly name: HazardName;
  readonly col: number;
  readonly row: number;
  readonly length: number;
}

const runsInRow = (level: Level, row: number): Run[] => {
  const runs: Run[] = [];
  let start = -1;
  for (let col = 0; col <= level.cols; col += 1) {
    const name = col < level.cols ? HAZARD_TILES[tileAt(level, col, row)] : undefined;
    const open = start >= 0 ? HAZARD_TILES[tileAt(level, start, row)] : undefined;
    if (open !== undefined && open !== name)
      runs.push({ name: open, col: start, row, length: col - start });
    if (open !== name) start = name === undefined ? -1 : col;
  }
  return runs;
};

const cache = new WeakMap<Level, readonly Run[]>();

const runsOf = (level: Level): readonly Run[] => {
  const known = cache.get(level);
  if (known !== undefined) return known;
  const runs = Array.from({ length: level.rows }, (_, row) => runsInRow(level, row)).flat();
  cache.set(level, runs);
  return runs;
};

const visible = (col: number, length: number, camera: number): boolean =>
  col + length > camera && col < camera + VIEW.cols;

const draw = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  [x0, y0, x1, y1]: Crop,
  x: number,
  y: number,
  width: number,
  height: number,
  shift = 0.5,
): void => {
  const top = image.naturalHeight * y0;
  const tall = image.naturalHeight * (y1 - y0);
  const span = image.naturalWidth * (x1 - x0);
  const wide = Math.min(span, (width / height) * tall);
  const left = image.naturalWidth * x0 + (span - wide) * shift;
  ctx.drawImage(image, left, top, wide, tall, x, y, width, height);
};

const shiftOf = (col: number): number => ((col * 37) % 100) / 100;

const FIRE: Crop = [0, 0, 1, 1];
const FLAMES: Crop = [0, 0, 1, 0.8];

const flames = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  bottom: number,
  width: number,
  height: number,
  seed: number,
  crop: Crop,
): void => {
  const tall = height * (1 + 0.07 * Math.sin(seed / 6));
  draw(ctx, image, crop, x, bottom - tall, width, tall, shiftOf(seed));
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.25 * Math.sin(seed / 9);
  ctx.translate(x + width, 0);
  ctx.scale(-1, 1);
  draw(ctx, image, crop, 0, bottom - height, width, height, shiftOf(seed + 3));
  ctx.restore();
};

type Painter = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  run: Run,
  x: number,
  tick: number,
) => void;

const PAINTERS: Readonly<Record<HazardName, Painter>> = {
  fire: (ctx, image, run, x, tick) => {
    ctx.fillStyle = COLOR.pit;
    ctx.fillRect(x, run.row * PX + 8, run.length * PX, PX - 8);
    flames(
      ctx,
      image,
      x - 3,
      (run.row + 1) * PX,
      run.length * PX + 6,
      24,
      tick + run.col * 7,
      FIRE,
    );
  },
  river: (ctx, image, run, x, tick) => {
    const drift = (Math.sin(tick / 80 + run.col) + 1) / 2;
    draw(ctx, image, [0, 0.27, 1, 0.8], x, run.row * PX + 4, run.length * PX, PX - 4, drift);
  },
  pothole: (ctx, image, run, x) => {
    draw(ctx, image, [0.25, 0.2, 0.78, 1], x - 6, run.row * PX - 3, run.length * PX + 12, PX + 3);
  },
  smog: (ctx, image, run, x, tick) => {
    const breath = 1 + 0.05 * Math.sin(tick / 20 + run.col);
    const width = (run.length * PX + 14) * breath;
    const height = (PX + 10) * breath;
    ctx.save();
    ctx.globalAlpha = 0.94;
    draw(
      ctx,
      image,
      [0, 0, 1, 1],
      x + (run.length * PX - width) / 2,
      run.row * PX - 5,
      width,
      height,
    );
    ctx.restore();
  },
};

const tag = (ctx: CanvasRenderingContext2D, text: string, centre: number, top: number): void => {
  ctx.font = TAG_FONT;
  const width = Math.ceil(ctx.measureText(text).width) + 6;
  const left = Math.round(centre - width / 2);
  ctx.fillStyle = COLOR.red;
  ctx.fillRect(left, top, width, 8);
  ctx.fillStyle = COLOR.white;
  ctx.textAlign = 'center';
  ctx.fillText(text, centre, top + 6);
  ctx.textAlign = 'left';
};

const sign = (ctx: CanvasRenderingContext2D, text: string, post: number, ground: number): void => {
  ctx.fillStyle = COLOR.steel;
  ctx.fillRect(post, ground - 16, 1, 16);
  tag(ctx, text, post, ground - 24);
};

const labelRun = (
  ctx: CanvasRenderingContext2D,
  level: Level,
  run: Run,
  x: number,
  text: string,
): void => {
  if (run.name === 'smog') {
    if (tileAt(level, run.col, run.row - 1) !== Tile.smog)
      tag(ctx, text, x + (run.length * PX) / 2, run.row * PX + 2);
    return;
  }
  sign(ctx, text, x + run.length * PX + 6, run.row * PX);
};

export const drawHazards = (
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  state: RunState,
  camera: number,
  tags: Readonly<Record<HazardName, string>>,
): void => {
  for (const run of runsOf(state.level)) {
    if (!visible(run.col, run.length, camera)) continue;
    const image = sprites.art(run.name);
    if (!isReady(image)) continue;
    const x = (run.col - camera) * PX;
    PAINTERS[run.name](ctx, image, run, x, state.tick);
    labelRun(ctx, state.level, run, x, tags[run.name]);
  }
};

const drawStone = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void => {
  ctx.fillStyle = COLOR.stone;
  ctx.fillRect(x, y, width, STONE);
  ctx.fillStyle = COLOR.stoneLight;
  ctx.fillRect(x, y, width, 1);
  ctx.strokeStyle = COLOR.ink;
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, STONE - 1);
  ctx.fillStyle = COLOR.stoneDark;
  for (let joint = x + 12; joint < x + width - 4; joint += 16)
    ctx.fillRect(joint, y + 1, 1, STONE - 2);
};

const drawGrill = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void => {
  ctx.fillStyle = COLOR.coal;
  ctx.fillRect(x + 2, y - 3, width - 4, 3);
  ctx.fillStyle = COLOR.iron;
  ctx.fillRect(x + 1, y - 7, width - 2, 1);
  for (let bar = x + 2; bar < x + width - 1; bar += 4) ctx.fillRect(bar, y - 7, 1, 7);
};

const drawSmoke = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  tick: number,
): void => {
  ctx.fillStyle = COLOR.smoke;
  for (let puff = 0; puff < length; puff += 1) {
    const rise = (tick + puff * 11) % 24;
    ctx.beginPath();
    ctx.arc(x + puff * PX + 8, y - 8 - rise / 2, 3 + rise / 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = COLOR.ember;
  for (let spark = 0; spark < length * 3; spark += 1) ctx.fillRect(x + 3 + spark * 5, y - 3, 1, 1);
};

const drawLedge = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  run: BurnRun,
  heat: Heat,
  camera: number,
  tick: number,
): void => {
  const x = (run.col - camera) * PX;
  const y = run.row * PX;
  const width = run.length * PX;
  drawStone(ctx, x, y, width);
  drawGrill(ctx, x, y, width);
  if (heat === 'smoke') drawSmoke(ctx, x, y, run.length, tick);
  if (heat === 'fire') flames(ctx, image, x - 2, y - 1, width + 4, 20, tick + run.col * 7, FLAMES);
};

export const drawLedges = (
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  state: RunState,
  camera: number,
  labels: readonly string[],
): void => {
  const image = sprites.art('fire');
  state.level.burns.forEach((run, index) => {
    if (!visible(run.col, run.length, camera)) return;
    if (isReady(image)) drawLedge(ctx, image, run, heatOf(run, state.tick), camera, state.tick);
    const label = labels[index % labels.length] ?? '';
    tag(ctx, label, (run.col - camera) * PX + (run.length * PX) / 2, run.row * PX + STONE + 2);
  });
};
