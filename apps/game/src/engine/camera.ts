import { VIEW } from '../content/tuning.ts';
import type { Level } from '../core/level.ts';

const HALF = VIEW.cols / 2;
const EDGE = 3;

const clamp = (level: Level, col: number): number =>
  Math.max(0, Math.min(col, level.cols - VIEW.cols));

export const snapCamera = (level: Level, centerCol: number): number =>
  clamp(level, Math.floor((centerCol - EDGE) / HALF) * HALF);

export const followCamera = (level: Level, col: number, centerCol: number): number => {
  if (centerCol >= col + VIEW.cols - EDGE) return clamp(level, col + HALF);
  if (centerCol < col + EDGE) return clamp(level, col - HALF);
  return col;
};
