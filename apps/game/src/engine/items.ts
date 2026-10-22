import type { Item } from '../content/roles.ts';
import { COLOR } from './palette.ts';
import { isReady, type Sprites } from './sprites.ts';

type Painter = (
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  x: number,
  y: number,
  tick: number,
) => void;

const bob = (tick: number, x: number): number => Math.round(Math.sin(tick / 12 + x / 16) * 1.5);

const flag: Painter = (ctx, _sprites, x, y, tick) => {
  const top = y + 2 + bob(tick, x);
  ctx.fillStyle = COLOR.steel;
  ctx.fillRect(x + 4, y + 2, 1, 13);
  ctx.fillStyle = COLOR.flagSaffron;
  ctx.fillRect(x + 5, top, 9, 2);
  ctx.fillStyle = COLOR.white;
  ctx.fillRect(x + 5, top + 2, 9, 2);
  ctx.fillStyle = COLOR.flagGreen;
  ctx.fillRect(x + 5, top + 4, 9, 2);
  ctx.fillStyle = COLOR.chakra;
  ctx.fillRect(x + 9, top + 2, 1, 2);
};

const money: Painter = (ctx, _sprites, x, y, tick) => {
  const top = y + 5 + bob(tick, x);
  ctx.fillStyle = COLOR.money;
  ctx.fillRect(x + 2, top, 12, 7);
  ctx.fillStyle = COLOR.moneyLight;
  ctx.fillRect(x + 3, top + 1, 10, 5);
  ctx.fillStyle = COLOR.money;
  ctx.fillRect(x + 7, top + 2, 2, 3);
  ctx.strokeStyle = COLOR.ink;
  ctx.strokeRect(x + 1.5, top - 0.5, 13, 8);
};

const roach: Painter = (ctx, sprites, x, y, tick) => {
  const image = sprites.art('crowd');
  if (!isReady(image)) return;
  const height = 15;
  const width = (height * image.naturalWidth) / image.naturalHeight;
  const sway = Math.sin(tick / 10 + x) > 0;
  ctx.save();
  ctx.translate(x + 8, y + 16);
  if (sway) ctx.scale(-1, 1);
  ctx.drawImage(image, -width / 2, -height, width, height);
  ctx.restore();
};

const story: Painter = (ctx, _sprites, x, y, tick) => {
  const top = y + 4 + bob(tick, x);
  ctx.fillStyle = COLOR.paper;
  ctx.fillRect(x + 2, top, 12, 10);
  ctx.fillStyle = COLOR.red;
  ctx.fillRect(x + 2, top, 12, 3);
  ctx.fillStyle = COLOR.stoneDark;
  for (let line = 0; line < 3; line += 1) ctx.fillRect(x + 4, top + 4 + line * 2, 8, 1);
  ctx.strokeStyle = COLOR.ink;
  ctx.strokeRect(x + 1.5, top - 0.5, 13, 11);
};

export const ITEM_PAINTERS: Readonly<Record<Item, Painter>> = { flag, money, roach, story };

const chai: Painter = (ctx, _sprites, x, y) => {
  ctx.fillStyle = COLOR.white;
  ctx.fillRect(x + 4, y + 7, 7, 8);
  ctx.fillRect(x + 11, y + 9, 2, 3);
  ctx.fillStyle = COLOR.chai;
  ctx.fillRect(x + 5, y + 8, 5, 2);
  ctx.fillStyle = COLOR.smoke;
  ctx.fillRect(x + 6, y + 3, 1, 3);
  ctx.fillRect(x + 8, y + 2, 1, 3);
};

const samosa: Painter = (ctx, _sprites, x, y) => {
  ctx.fillStyle = COLOR.samosa;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 5);
  ctx.lineTo(x + 14, y + 15);
  ctx.lineTo(x + 2, y + 15);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLOR.samosaDark;
  ctx.stroke();
};

export const drawRefill = (
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  x: number,
  y: number,
  tick: number,
  index: number,
): void => {
  (index % 2 === 0 ? chai : samosa)(ctx, sprites, x, y, tick);
};
