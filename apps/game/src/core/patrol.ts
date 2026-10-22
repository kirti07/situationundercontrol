import { PATROL } from '../content/tuning.ts';
import { type Box, cellOf } from './geometry.ts';
import { type Level, Tile, tileAt } from './level.ts';
import type { PatrolState } from './state.ts';

export const patrolBox = (patrol: PatrolState): Box => ({
  x: patrol.x,
  y: patrol.y,
  w: PATROL.width,
  h: PATROL.height,
});

export const isAwake = (patrol: PatrolState): boolean => patrol.sleep === 0;

export const isTired = (patrol: PatrolState): boolean =>
  isAwake(patrol) && patrol.energy < PATROL.tiredBelow;

const FLOORS: ReadonlySet<Tile> = new Set([Tile.solid, Tile.platform]);

const blockedAt = (level: Level, patrol: PatrolState, x: number): boolean => {
  const col = cellOf(patrol.dir > 0 ? x + PATROL.width - 1 : x);
  const feet = patrol.y + PATROL.height;
  return (
    tileAt(level, col, cellOf(feet - 1)) === Tile.solid ||
    !FLOORS.has(tileAt(level, col, cellOf(feet)))
  );
};

const rest = (patrol: PatrolState): void => {
  patrol.sleep -= 1;
  if (patrol.sleep === 0) patrol.energy = PATROL.energyMax;
};

export const updatePatrol = (level: Level, patrol: PatrolState): boolean => {
  if (!isAwake(patrol)) {
    rest(patrol);
    return false;
  }
  patrol.energy -= 1;
  if (patrol.energy <= 0) {
    patrol.sleep = PATROL.sleepTicks;
    return true;
  }
  const speed = isTired(patrol) ? PATROL.tiredSpeed : PATROL.walkSpeed;
  const x = patrol.x + patrol.dir * speed;
  if (blockedAt(level, patrol, x)) {
    patrol.dir = patrol.dir > 0 ? -1 : 1;
    return false;
  }
  patrol.x = x;
  return false;
};
