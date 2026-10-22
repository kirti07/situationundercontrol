import { TILE } from '../content/tuning.ts';
import { anyCell, cellOf } from './geometry.ts';
import { type Level, Tile, tileAt } from './level.ts';

export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Size {
  readonly w: number;
  readonly h: number;
}

const isSolid = (level: Level, col: number, row: number): boolean =>
  tileAt(level, col, row) === Tile.solid;

const isFloor = (level: Level, col: number, row: number, fromAbove: boolean): boolean => {
  const tile = tileAt(level, col, row);
  return tile === Tile.solid || (fromAbove && tile === Tile.platform);
};

const moveX = (level: Level, body: Body, size: Size): void => {
  if (body.vx === 0) return;
  const x = body.x + body.vx;
  const col = cellOf(body.vx > 0 ? x + size.w - 1 : x);
  const blocked = anyCell(body.y, body.y + size.h - 1, (row) => isSolid(level, col, row));
  if (!blocked) {
    body.x = x;
    return;
  }
  body.x = body.vx > 0 ? col * TILE - size.w : (col + 1) * TILE;
};

const moveUp = (level: Level, body: Body, size: Size): void => {
  const y = body.y + body.vy;
  const row = cellOf(y);
  const blocked = anyCell(body.x, body.x + size.w - 1, (col) => isSolid(level, col, row));
  body.y = blocked ? (row + 1) * TILE : y;
  if (blocked) body.vy = 0;
};

const moveDown = (level: Level, body: Body, size: Size): boolean => {
  const y = body.y + body.vy;
  const row = cellOf(y + size.h - 1);
  const fromAbove = body.y + size.h <= row * TILE;
  const landed = anyCell(body.x, body.x + size.w - 1, (col) => isFloor(level, col, row, fromAbove));
  if (!landed) {
    body.y = y;
    return false;
  }
  body.y = row * TILE - size.h;
  body.vy = 0;
  return true;
};

export const moveBody = (level: Level, body: Body, size: Size): boolean => {
  moveX(level, body, size);
  if (body.vy < 0) {
    moveUp(level, body, size);
    return false;
  }
  return moveDown(level, body, size);
};

export const touchesTile = (level: Level, body: Body, size: Size, tile: Tile): boolean =>
  anyCell(body.y, body.y + size.h - 1, (row) =>
    anyCell(body.x, body.x + size.w - 1, (col) => tileAt(level, col, row) === tile),
  );
