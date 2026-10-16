import { describe, expect, it } from 'vitest';
import { CELL, GRID_COLS } from '../src/config.ts';
import { ARCH_FIELD, NO_DIRECTION } from '../src/flow.ts';
import { ARCH_CELLS, BRIDGES, CANALS, cellOf, LANES, METRO_Y, PASSABLE } from '../src/map.ts';

const cellsIn = (rect: { x: number; y: number; w: number; h: number }): number[] =>
  Array.from({ length: (rect.w / CELL) * (rect.h / CELL) }, (_, i) =>
    cellOf(rect.x + (i % (rect.w / CELL)) * CELL, rect.y + Math.floor(i / (rect.w / CELL)) * CELL),
  );

describe('map', () => {
  it('makes canals impassable and bridges passable', () => {
    expect(CANALS.flatMap(cellsIn).every((cell) => PASSABLE[cell] === 0)).toBe(true);
    expect(BRIDGES.flatMap(cellsIn).every((cell) => PASSABLE[cell] === 1)).toBe(true);
  });

  it('gives every open cell outside the arch a way toward it', () => {
    const stranded = Array.from(PASSABLE.keys()).filter(
      (cell) =>
        PASSABLE[cell] === 1 && ARCH_CELLS[cell] === 0 && ARCH_FIELD.dir[cell] === NO_DIRECTION,
    );
    expect(stranded).toEqual([]);
  });

  it('starts every lane at the metro', () => {
    for (const lane of LANES) {
      expect(PASSABLE[cellOf(lane.centerX, METRO_Y)]).toBe(1);
    }
    expect(GRID_COLS).toBe(30);
  });
});
