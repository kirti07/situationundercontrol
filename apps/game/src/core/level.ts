import { LEGEND, type LevelDef } from '../content/levels.ts';
import type { Side } from '../content/roles.ts';
import { type BurnRun, findBurns } from './burn.ts';

export const Tile = {
  empty: 0,
  solid: 1,
  platform: 2,
  fire: 3,
  river: 4,
  pothole: 5,
  smog: 6,
} as const;
export type Tile = (typeof Tile)[keyof typeof Tile];

export interface Cell {
  readonly col: number;
  readonly row: number;
}

export interface Level {
  readonly id: string;
  readonly name: string;
  readonly side: Side;
  readonly cols: number;
  readonly rows: number;
  readonly tiles: Uint8Array;
  readonly start: Cell;
  readonly exit: Cell;
  readonly collectibles: readonly Cell[];
  readonly refills: readonly Cell[];
  readonly patrols: readonly Cell[];
  readonly jails: readonly Cell[];
  readonly burns: readonly BurnRun[];
}

const TILE_OF: Readonly<Record<string, Tile>> = {
  [LEGEND.ground]: Tile.solid,
  [LEGEND.platform]: Tile.platform,
  [LEGEND.burning]: Tile.platform,
  [LEGEND.timed]: Tile.platform,
  [LEGEND.fire]: Tile.fire,
  [LEGEND.river]: Tile.river,
  [LEGEND.pothole]: Tile.pothole,
  [LEGEND.smog]: Tile.smog,
};

const charsOf = (line: string): string[] =>
  Array.from({ length: line.length }, (_, index) => line.charAt(index));

const readCells = (id: string, map: readonly string[]): Map<string, Cell[]> => {
  const cols = map[0]?.length ?? 0;
  const cells = new Map<string, Cell[]>();
  map.forEach((line, row) => {
    if (line.length !== cols) {
      throw new Error(
        `${id}: row ${String(row)} is ${String(line.length)} wide, not ${String(cols)}`,
      );
    }
    charsOf(line).forEach((char, col) => {
      cells.set(char, [...(cells.get(char) ?? []), { col, row }]);
    });
  });
  return cells;
};

const single = (id: string, cells: Map<string, Cell[]>, char: string): Cell => {
  const found = cells.get(char) ?? [];
  const [cell] = found;
  if (found.length !== 1 || cell === undefined) {
    throw new Error(`${id}: needs exactly one '${char}', found ${String(found.length)}`);
  }
  return cell;
};

const tilesOf = (map: readonly string[], cols: number): Uint8Array => {
  const tiles = new Uint8Array(cols * map.length);
  map.forEach((line, row) => {
    charsOf(line).forEach((char, col) => {
      tiles[row * cols + col] = TILE_OF[char] ?? Tile.empty;
    });
  });
  return tiles;
};

const readingOrder = (a: Cell, b: Cell): number => a.row - b.row || a.col - b.col;

export const parseLevel = (def: LevelDef, side: Side): Level => {
  const map = def.maps[side];
  const cells = readCells(def.id, map);
  const cols = map[0]?.length ?? 0;
  const all = (char: string): Cell[] => cells.get(char) ?? [];
  const collectibles = [...all(LEGEND.flag), ...all(LEGEND.money)].sort(readingOrder);
  if (collectibles.length === 0) throw new Error(`${def.id}: nothing to collect`);
  return {
    id: def.id,
    name: def.name,
    side,
    cols,
    rows: map.length,
    tiles: tilesOf(map, cols),
    start: single(def.id, cells, LEGEND.start),
    exit: single(def.id, cells, LEGEND.exit),
    collectibles,
    refills: all(LEGEND.refill),
    patrols: all(LEGEND.patrol),
    jails: all(LEGEND.jail),
    burns: findBurns(map),
  };
};

export const tileAt = (level: Level, col: number, row: number): Tile => {
  if (col < 0 || col >= level.cols) return Tile.solid;
  if (row < 0 || row >= level.rows) return Tile.empty;
  return (level.tiles[row * level.cols + col] ?? Tile.empty) as Tile;
};
