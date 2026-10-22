import { TILE } from '../content/tuning.ts';
import type { Cell } from './level.ts';

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export const cellOf = (units: number): number => Math.floor(units / TILE);

export const overlaps = (a: Box, b: Box): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export const cellBox = (cell: Cell, inset = 0): Box => ({
  x: cell.col * TILE + inset,
  y: cell.row * TILE + inset,
  w: TILE - 2 * inset,
  h: TILE - 2 * inset,
});

export const anyCell = (from: number, to: number, test: (index: number) => boolean): boolean => {
  for (let index = cellOf(from); index <= cellOf(to); index += 1) {
    if (test(index)) return true;
  }
  return false;
};
