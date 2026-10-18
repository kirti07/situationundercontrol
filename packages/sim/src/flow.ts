import { GRID_COLS, GRID_ROWS } from './config.ts';
import { createHeap, popHeap, pushHeap, type MinHeap } from './heap.ts';
import { ARCH_CELLS, CELL_COUNT, PASSABLE } from './map.ts';

export interface Direction {
  readonly dc: number;
  readonly dr: number;
  readonly dx: number;
  readonly dy: number;
  readonly cost: number;
}

const ORTHOGONAL = 5;
const DIAGONAL = 7;
const UNREACHED = 1 << 20;
const KEY_SHIFT = 2048;

export const NO_DIRECTION = 0;

const STILL: Direction = { dc: 0, dr: 0, dx: 0, dy: 0, cost: 0 };

const DIRECTIONS: readonly Direction[] = [
  STILL,
  { dc: 0, dr: -1, dx: 0, dy: -256, cost: ORTHOGONAL },
  { dc: 1, dr: 0, dx: 256, dy: 0, cost: ORTHOGONAL },
  { dc: 0, dr: 1, dx: 0, dy: 256, cost: ORTHOGONAL },
  { dc: -1, dr: 0, dx: -256, dy: 0, cost: ORTHOGONAL },
  { dc: 1, dr: -1, dx: 181, dy: -181, cost: DIAGONAL },
  { dc: 1, dr: 1, dx: 181, dy: 181, cost: DIAGONAL },
  { dc: -1, dr: 1, dx: -181, dy: 181, cost: DIAGONAL },
  { dc: -1, dr: -1, dx: -181, dy: -181, cost: DIAGONAL },
];

export const direction = (index: number): Direction => DIRECTIONS[index] ?? STILL;

export interface FlowField {
  readonly dist: Int32Array;
  readonly dir: Uint8Array;
  readonly heap: MinHeap;
}

export const createField = (): FlowField => ({
  dist: new Int32Array(CELL_COUNT),
  dir: new Uint8Array(CELL_COUNT),
  heap: createHeap(CELL_COUNT * DIRECTIONS.length),
});

const open = (col: number, row: number): boolean =>
  col >= 0 &&
  row >= 0 &&
  col < GRID_COLS &&
  row < GRID_ROWS &&
  PASSABLE[row * GRID_COLS + col] === 1;

const neighbour = (cell: number, index: number): number => {
  const { dc, dr } = direction(index);
  const col = (cell % GRID_COLS) + dc;
  const row = Math.floor(cell / GRID_COLS) + dr;
  const reachable = open(col, row) && open(col, row - dr) && open(col - dc, row);
  return reachable ? row * GRID_COLS + col : -1;
};

const distanceAt = (field: FlowField, cell: number): number =>
  cell >= 0 ? (field.dist[cell] ?? UNREACHED) : UNREACHED;

const relax = (field: FlowField, cell: number, distance: number): void => {
  for (let index = 1; index < DIRECTIONS.length; index += 1) {
    const next = neighbour(cell, index);
    const candidate = distance + direction(index).cost;
    if (next >= 0 && candidate < distanceAt(field, next)) {
      field.dist[next] = candidate;
      pushHeap(field.heap, candidate * KEY_SHIFT + next);
    }
  }
};

const bestDirection = (field: FlowField, cell: number): number => {
  let best = NO_DIRECTION;
  let bestDistance = distanceAt(field, cell);
  for (let index = 1; index < DIRECTIONS.length; index += 1) {
    const distance = distanceAt(field, neighbour(cell, index));
    best = distance < bestDistance ? index : best;
    bestDistance = Math.min(distance, bestDistance);
  }
  return best;
};

const seedGoals = (field: FlowField, goals: Uint8Array): void => {
  field.dist.fill(UNREACHED);
  field.heap.size = 0;
  for (let cell = 0; cell < CELL_COUNT; cell += 1) {
    if (goals[cell] === 1) {
      field.dist[cell] = 0;
      pushHeap(field.heap, cell);
    }
  }
};

export const solveField = (field: FlowField, goals: Uint8Array): void => {
  seedGoals(field, goals);
  while (field.heap.size > 0) {
    const key = popHeap(field.heap);
    const cell = key % KEY_SHIFT;
    const distance = Math.floor(key / KEY_SHIFT);
    if (distance === field.dist[cell]) relax(field, cell, distance);
  }
  for (let cell = 0; cell < CELL_COUNT; cell += 1) {
    field.dir[cell] = bestDirection(field, cell);
  }
};

const buildArchField = (): FlowField => {
  const field = createField();
  solveField(field, ARCH_CELLS);
  return field;
};

export const ARCH_FIELD = buildArchField();
