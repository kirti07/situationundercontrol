import { MAX_ACTIVE, SPEED_BY_GENERATION } from '../config.ts';
import { ARCH_FIELD, direction, type Direction } from '../flow.ts';
import { cellOfSub, isPassableSub } from '../map.ts';
import type { Roaches, State } from '../state.ts';

const scaled = (speed: number, component: number): number => Math.trunc((speed * component) / 256);

const headingAt = (x: number, y: number): Direction =>
  direction(ARCH_FIELD.dir[cellOfSub(x, y)] ?? 0);

const speedOf = (gen: number): number => SPEED_BY_GENERATION[gen] ?? 0;

const settle = (roaches: Roaches, slot: number, nx: number, ny: number): void => {
  const x = roaches.x[slot] ?? 0;
  const y = roaches.y[slot] ?? 0;
  if (isPassableSub(nx, ny)) {
    roaches.x[slot] = nx;
    roaches.y[slot] = ny;
    return;
  }
  if (isPassableSub(nx, y)) {
    roaches.x[slot] = nx;
    return;
  }
  if (isPassableSub(x, ny)) roaches.y[slot] = ny;
};

const advance = (roaches: Roaches, slot: number): void => {
  const x = roaches.x[slot] ?? 0;
  const y = roaches.y[slot] ?? 0;
  const heading = headingAt(x, y);
  const speed = speedOf(roaches.gen[slot] ?? 0);
  settle(roaches, slot, x + scaled(speed, heading.dx), y + scaled(speed, heading.dy));
};

export const moveSystem = (state: State): void => {
  const roaches = state.roaches;
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    roaches.px[slot] = roaches.x[slot] ?? 0;
    roaches.py[slot] = roaches.y[slot] ?? 0;
    if (roaches.alive[slot] === 1) advance(roaches, slot);
  }
};
