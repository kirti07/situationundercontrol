import {
  CELL,
  CHANT_RADIUS,
  countPace,
  FOLLOW_RADIUS,
  GRID_COLS,
  MomentKind,
  NOT_SCHEDULED,
  Pace,
  Side,
  type State,
} from '@suc/sim';
import { drawPill, PILLS } from './labels.ts';
import { PALETTE } from './palette.ts';

const HINT_AFTER_MS = 2500;
const HINT = { x: 180, y: 540 } as const;
const PULSE_MS = 420;

export interface Rally {
  readonly draw: (ctx: CanvasRenderingContext2D, state: State, now: number) => void;
}

const ring = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
): void => {
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
};

const drawPoint = (ctx: CanvasRenderingContext2D, state: State, now: number): void => {
  const cell = state.steering.cell;
  const x = (cell % GRID_COLS) * CELL + CELL / 2;
  const y = Math.floor(cell / GRID_COLS) * CELL + CELL / 2;
  ctx.strokeStyle = PALETTE.marigold;
  ctx.lineWidth = 1;
  ring(ctx, x, y, FOLLOW_RADIUS, 0.25);
  ctx.setLineDash([3, 3]);
  ctx.lineDashOffset = -now / 60;
  ctx.lineWidth = 2;
  ring(ctx, x, y, CHANT_RADIUS, 0.55);
  ring(ctx, x, y, 14, 1);
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  drawPill(ctx, x, y - 26, `RALLY · ${String(countPace(state, Pace.Chant))} CHANTING`, PILLS.swarm);
};

const leadRally = (reducedMotion: () => boolean): Rally => {
  let ledAt = 0;
  const pulse = (now: number): number =>
    reducedMotion() ? 1 : 0.55 + 0.45 * Math.abs(Math.sin(now / PULSE_MS));
  return {
    draw: (ctx, state, now) => {
      if (state.steering.cell !== NOT_SCHEDULED) {
        ledAt = now;
        drawPoint(ctx, state, now);
        return;
      }
      if (now - ledAt < HINT_AFTER_MS || state.moment.kind !== MomentKind.None) return;
      ctx.globalAlpha = pulse(now);
      drawPill(ctx, HINT.x, HINT.y, 'HOLD AND DRAG TO LEAD', PILLS.swarm);
      ctx.globalAlpha = 1;
    },
  };
};

const SIDE_RALLY: Readonly<Record<Side, (reducedMotion: () => boolean) => Rally>> = {
  [Side.Agency]: () => ({ draw: () => undefined }),
  [Side.Cockroach]: leadRally,
};

export const createRally = (side: Side, reducedMotion: () => boolean): Rally =>
  SIDE_RALLY[side](reducedMotion);
