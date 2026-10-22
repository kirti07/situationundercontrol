import { VIEW } from '../content/tuning.ts';
import { type Cell, type Level, Tile, tileAt } from '../core/level.ts';
import type { Role } from '../content/roles.ts';
import type { RunState } from '../core/state.ts';
import { drawRefill, ITEM_PAINTERS } from './items.ts';
import { COLOR, TAG_FONT } from './palette.ts';
import type { Sprites } from './sprites.ts';

const PX = 16;
const STARS = 24;

type Painter = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  tick: number,
) => void;

const ground: Painter = (ctx, x, y) => {
  ctx.fillStyle = COLOR.sandstone;
  ctx.fillRect(x, y, PX, PX);
  ctx.fillStyle = COLOR.sandstoneLight;
  ctx.fillRect(x, y, PX, 2);
  ctx.strokeStyle = COLOR.sandstoneDark;
  ctx.strokeRect(x + 0.5, y + 0.5, PX - 1, PX - 1);
};

const platform: Painter = (ctx, x, y, col) => {
  ctx.fillStyle = col % 2 === 0 ? COLOR.saffron : COLOR.white;
  ctx.fillRect(x, y, PX, 6);
  ctx.strokeStyle = COLOR.ink;
  ctx.strokeRect(x + 0.5, y + 0.5, PX - 1, 5);
};

const PAINTERS: Readonly<Record<Tile, Painter | undefined>> = {
  [Tile.empty]: undefined,
  [Tile.solid]: ground,
  [Tile.platform]: platform,
  [Tile.fire]: undefined,
  [Tile.river]: undefined,
  [Tile.pothole]: undefined,
  [Tile.smog]: undefined,
};

export const drawSky = (ctx: CanvasRenderingContext2D, camera: number): void => {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW.rows * PX);
  sky.addColorStop(0, COLOR.night);
  sky.addColorStop(1, COLOR.night3);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.cols * PX, VIEW.rows * PX);
  ctx.fillStyle = COLOR.star;
  for (let star = 0; star < STARS; star += 1) {
    const x = (star * 97 + 13 - camera * 4) % (VIEW.cols * PX);
    ctx.fillRect(x < 0 ? x + VIEW.cols * PX : x, ((star * 53) % 72) + 4, 1, 1);
  }
};

export const drawTiles = (
  ctx: CanvasRenderingContext2D,
  level: Level,
  camera: number,
  tick: number,
): void => {
  for (let row = 0; row < level.rows; row += 1) {
    for (let col = camera; col < camera + VIEW.cols; col += 1) {
      PAINTERS[tileAt(level, col, row)]?.(ctx, (col - camera) * PX, row * PX, col, tick);
    }
  }
};

const at = (cell: Cell, camera: number): { x: number; y: number } => ({
  x: (cell.col - camera) * PX,
  y: cell.row * PX,
});

const drawJail = (ctx: CanvasRenderingContext2D, cell: Cell, camera: number): void => {
  const { x, y } = at(cell, camera);
  ctx.fillStyle = COLOR.night2;
  ctx.fillRect(x + 1, y + 1, PX - 2, PX - 1);
  ctx.fillStyle = COLOR.red;
  for (let bar = 0; bar < 4; bar += 1) ctx.fillRect(x + 2 + bar * 4, y + 1, 1, PX - 1);
  ctx.fillRect(x + 1, y + 1, PX - 2, 1);
};

const drawGate = (
  ctx: CanvasRenderingContext2D,
  cell: Cell,
  camera: number,
  open: boolean,
): void => {
  const { x, y } = at(cell, camera);
  ctx.fillStyle = COLOR.sandstone;
  ctx.fillRect(x - 2, y - PX, PX + 4, PX * 2);
  ctx.fillStyle = open ? COLOR.sodium : COLOR.doorway;
  ctx.fillRect(x + 2, y - PX + 5, PX - 4, PX * 2 - 5);
  ctx.strokeStyle = COLOR.ink;
  ctx.strokeRect(x - 1.5, y - PX + 0.5, PX + 3, PX * 2 - 1);
  if (open) return;
  ctx.fillStyle = COLOR.red;
  ctx.fillRect(x + 6, y + 2, 4, 4);
};

const drawStage = (
  ctx: CanvasRenderingContext2D,
  cell: Cell,
  camera: number,
  open: boolean,
): void => {
  const { x, y } = at(cell, camera);
  ctx.fillStyle = open ? COLOR.sodium : COLOR.cream;
  ctx.fillRect(x - 4, y - PX + 1, PX + 8, PX + 2);
  ctx.strokeStyle = COLOR.ink;
  ctx.strokeRect(x - 3.5, y - PX + 1.5, PX + 7, PX + 1);
  ctx.fillStyle = COLOR.ink;
  ctx.font = TAG_FONT;
  ctx.textAlign = 'center';
  ctx.fillText('PHOTO', x + PX / 2, y - 6);
  ctx.fillText('OP', x + PX / 2, y + 1);
  ctx.textAlign = 'left';
  ctx.fillStyle = COLOR.saffron;
  ctx.fillRect(x - 5, y + PX - 5, PX + 10, 5);
  if (open) return;
  ctx.fillStyle = COLOR.red;
  ctx.fillRect(x + 6, y + 4, 4, 4);
};

const EXITS = { gate: drawGate, stage: drawStage } as const;

export const drawProps = (
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  state: RunState,
  camera: number,
  role: Role,
): void => {
  const { level } = state;
  EXITS[role.exit](ctx, level.exit, camera, state.exitOpen);
  level.jails.forEach((cell) => {
    drawJail(ctx, cell, camera);
  });
  const item = ITEM_PAINTERS[role.item];
  level.collectibles.forEach((cell, index) => {
    if (state.collected[index] !== true) {
      item(ctx, sprites, at(cell, camera).x, cell.row * PX, state.tick);
    }
  });
  level.refills.forEach((cell, index) => {
    if (state.refillsTaken[index] !== true) {
      drawRefill(ctx, sprites, at(cell, camera).x, cell.row * PX, state.tick, index);
    }
  });
};
