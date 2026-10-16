import { CELL, FIELD_HEIGHT, FIELD_WIDTH, GRID_COLS, GRID_ROWS, SUB } from './config.ts';

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface LaneShape {
  readonly minX: number;
  readonly maxX: number;
  readonly centerX: number;
}

export const LANE_COUNT = 3;
export const LAWN_LANES: readonly number[] = [0, 2];

export const LANES: readonly LaneShape[] = [
  { minX: 12, maxX: 108, centerX: 60 },
  { minX: 132, maxX: 228, centerX: 180 },
  { minX: 252, maxX: 348, centerX: 300 },
];

export const OPEN_GROUND: readonly Rect[] = [
  { x: 0, y: 120, w: 360, h: 156 },
  { x: 12, y: 276, w: 336, h: 348 },
  { x: 0, y: 624, w: 360, h: 24 },
];

export const CANALS: readonly Rect[] = [
  { x: 108, y: 276, w: 24, h: 120 },
  { x: 108, y: 420, w: 24, h: 108 },
  { x: 108, y: 552, w: 24, h: 72 },
  { x: 228, y: 276, w: 24, h: 120 },
  { x: 228, y: 420, w: 24, h: 108 },
  { x: 228, y: 552, w: 24, h: 72 },
];

export const BRIDGES: readonly Rect[] = [
  { x: 108, y: 396, w: 24, h: 24 },
  { x: 108, y: 528, w: 24, h: 24 },
  { x: 228, y: 396, w: 24, h: 24 },
  { x: 228, y: 528, w: 24, h: 24 },
];

export const LAWNS: readonly Rect[] = [
  { x: 12, y: 276, w: 96, h: 348 },
  { x: 252, y: 276, w: 96, h: 348 },
];

export const ARCH: Rect = { x: 156, y: 132, w: 48, h: 24 };
export const METRO_Y = 636;
export const LAWN_Y_MIN = 300;
export const LAWN_Y_MAX = 600;

export const ROADS: readonly Point[] = [
  { x: 24, y: 132 },
  { x: 336, y: 132 },
  { x: 24, y: 252 },
  { x: 336, y: 252 },
  { x: 96, y: 264 },
  { x: 264, y: 264 },
];

export const CELL_COUNT = GRID_COLS * GRID_ROWS;

export const cellOf = (x: number, y: number): number =>
  Math.floor(Math.min(y, FIELD_HEIGHT - 1) / CELL) * GRID_COLS +
  Math.floor(Math.min(x, FIELD_WIDTH - 1) / CELL);

export const cellOfSub = (x: number, y: number): number => cellOf(x >> 8, y >> 8);

export const subOf = (units: number): number => units * SUB;

const markRects = (mask: Uint8Array, rects: readonly Rect[], value: number): void => {
  for (const rect of rects) {
    for (let y = rect.y; y < rect.y + rect.h; y += CELL) {
      const row = cellOf(rect.x, y);
      mask.fill(value, row, row + rect.w / CELL);
    }
  }
};

const buildPassable = (): Uint8Array => {
  const mask = new Uint8Array(CELL_COUNT);
  markRects(mask, OPEN_GROUND, 1);
  markRects(mask, CANALS, 0);
  return mask;
};

const buildArch = (): Uint8Array => {
  const mask = new Uint8Array(CELL_COUNT);
  markRects(mask, [ARCH], 1);
  return mask;
};

export const PASSABLE = buildPassable();
export const ARCH_CELLS = buildArch();

const insideField = (x: number, y: number): boolean =>
  x >= 0 && y >= 0 && x < FIELD_WIDTH * SUB && y < FIELD_HEIGHT * SUB;

export const NO_LANE = LANE_COUNT;

const laneAt = (x: number): number => {
  const lane = LANES.findIndex((shape) => x >= shape.minX && x < shape.maxX);
  return lane === -1 ? NO_LANE : lane;
};

const LANE_BY_X = Int8Array.from({ length: FIELD_WIDTH + 1 }, (_, x) => laneAt(x));

export const laneAtSub = (x: number): number => LANE_BY_X[x >> 8] ?? NO_LANE;

export const isPassableSub = (x: number, y: number): boolean =>
  insideField(x, y) && PASSABLE[cellOfSub(x, y)] === 1;

const SEARCH_RADIUS = 8;

const ringCells = (cell: number, radius: number): number[] => {
  const col = cell % GRID_COLS;
  const row = Math.floor(cell / GRID_COLS);
  return Array.from({ length: (radius * 2 + 1) ** 2 }, (_, i) => ({
    c: col - radius + (i % (radius * 2 + 1)),
    r: row - radius + Math.floor(i / (radius * 2 + 1)),
  }))
    .filter(({ c, r }) => Math.max(Math.abs(c - col), Math.abs(r - row)) === radius)
    .filter(({ c, r }) => c >= 0 && r >= 0 && c < GRID_COLS && r < GRID_ROWS)
    .map(({ c, r }) => r * GRID_COLS + c);
};

const nearestOpen = (cell: number): number => {
  for (let radius = 0; radius <= SEARCH_RADIUS; radius += 1) {
    const found = ringCells(cell, radius).find((candidate) => PASSABLE[candidate] === 1);
    if (found !== undefined) return found;
  }
  return cell;
};

export const NEAREST_OPEN = Int16Array.from({ length: CELL_COUNT }, (_, cell) => nearestOpen(cell));
