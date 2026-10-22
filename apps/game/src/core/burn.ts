import { LEGEND } from '../content/levels.ts';
import { BURN, TILE } from '../content/tuning.ts';
import type { Box } from './geometry.ts';

export interface BurnRun {
  readonly col: number;
  readonly row: number;
  readonly length: number;
  readonly always: boolean;
  readonly offset: number;
}

export type Heat = 'cold' | 'smoke' | 'fire';

const BURNING: ReadonlySet<string> = new Set([LEGEND.burning, LEGEND.timed]);

const offsetOf = (col: number, row: number): number => (col * 37 + row * 91) % BURN.cycleTicks;

const runsInRow = (line: string, row: number): BurnRun[] => {
  const runs: BurnRun[] = [];
  let start = -1;
  for (let col = 0; col <= line.length; col += 1) {
    const char = line.charAt(col);
    const same = start >= 0 && char === line.charAt(start);
    if (start >= 0 && !same) {
      const always = line.charAt(start) === LEGEND.burning;
      runs.push({ col: start, row, length: col - start, always, offset: offsetOf(start, row) });
    }
    if (!same) start = BURNING.has(char) ? col : -1;
  }
  return runs;
};

export const findBurns = (map: readonly string[]): BurnRun[] =>
  map.flatMap((line, row) => runsInRow(line, row));

export const heatOf = (run: BurnRun, tick: number): Heat => {
  if (run.always) return 'fire';
  const phase = (tick + run.offset) % BURN.cycleTicks;
  if (phase >= BURN.cycleTicks - BURN.burnTicks) return 'fire';
  if (phase >= BURN.cycleTicks - BURN.burnTicks - BURN.smokeTicks) return 'smoke';
  return 'cold';
};

export const burnBox = (run: BurnRun): Box => ({
  x: run.col * TILE,
  y: run.row * TILE - BURN.reach,
  w: run.length * TILE,
  h: BURN.reach + TILE / 2,
});
