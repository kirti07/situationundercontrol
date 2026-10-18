import { CELL, InputKind, MomentKind } from '@suc/sim';
import type { WorldPoint } from '../render/viewport.ts';
import type { PointerHandlers } from '../input/pointer.ts';
import { queueInput, type Session } from './session.ts';

const STEER_POINTER = 0;
const MIN_TICKS_BETWEEN_STEERS = 6;

const cellKey = (point: WorldPoint): number =>
  Math.floor(point.y / CELL) * 1000 + Math.floor(point.x / CELL);

export const createSteerer = (session: Session): PointerHandlers => {
  let lastCell = -1;
  let lastTick = -MIN_TICKS_BETWEEN_STEERS;
  let accusing = false;

  const steer = (point: WorldPoint, force: boolean): void => {
    const cell = cellKey(point);
    const due = session.state.tick - lastTick >= MIN_TICKS_BETWEEN_STEERS;
    if (cell === lastCell || (!due && !force)) return;
    lastCell = cell;
    lastTick = session.state.tick;
    queueInput(session, InputKind.Steer, STEER_POINTER, point.x, point.y);
  };

  return {
    press: (slot, point) => {
      accusing = session.state.moment.kind === MomentKind.Fake;
      if (accusing) {
        queueInput(session, InputKind.Tap, slot, point.x, point.y);
        return;
      }
      if (slot === STEER_POINTER) steer(point, true);
    },
    move: (slot, point) => {
      if (slot === STEER_POINTER && !accusing) steer(point, false);
    },
    release: (slot) => {
      if (slot !== STEER_POINTER || accusing) return;
      lastCell = -1;
      queueInput(session, InputKind.SteerEnd, STEER_POINTER, 0, 0);
    },
  };
};
