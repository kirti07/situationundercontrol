import { DENSITY_CELL, MAX_ACTIVE, SUB } from './config.ts';
import { DENSITY_COLS, type State } from './state.ts';

export const NO_CLUSTER = -1;

const densityIndex = (x: number, y: number): number =>
  Math.floor(y / (DENSITY_CELL * SUB)) * DENSITY_COLS + Math.floor(x / (DENSITY_CELL * SUB));

const countRoaches = (state: State): void => {
  const { density, roaches } = state;
  density.fill(0);
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    const index = densityIndex(roaches.x[slot] ?? 0, roaches.y[slot] ?? 0);
    density[index] = (density[index] ?? 0) + (roaches.alive[slot] ?? 0);
  }
};

export const densestCluster = (state: State): number => {
  countRoaches(state);
  let best = NO_CLUSTER;
  let bestCount = 0;
  for (let index = 0; index < state.density.length; index += 1) {
    const count = state.density[index] ?? 0;
    best = count > bestCount ? index : best;
    bestCount = Math.max(count, bestCount);
  }
  return best;
};

export const clusterCenterX = (cluster: number): number =>
  ((cluster % DENSITY_COLS) * DENSITY_CELL + DENSITY_CELL / 2) * SUB;

export const clusterCenterY = (cluster: number): number =>
  (Math.floor(cluster / DENSITY_COLS) * DENSITY_CELL + DENSITY_CELL / 2) * SUB;
