import {
  BARRICADE_SLOTS,
  LANES,
  NOT_SCHEDULED,
  STAMP_RADIUS,
  STAMP_WARNING,
  SUB,
  sitInActive,
  type State,
} from '@suc/sim';
import { PALETTE } from './palette.ts';

const BARRICADE_DEPTH = 6;
const STRIPES = 6;

const drawBarricade = (ctx: CanvasRenderingContext2D, state: State, slot: number): void => {
  const lane = LANES[state.barricades.lane[slot] ?? -1];
  if (!lane) return;
  const y = (state.barricades.y[slot] ?? 0) / SUB;
  const stripe = (lane.maxX - lane.minX) / STRIPES;
  for (let i = 0; i < STRIPES; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? PALETTE.agency : PALETTE.barricadeLight;
    ctx.fillRect(lane.minX + i * stripe, y - BARRICADE_DEPTH, stripe, BARRICADE_DEPTH);
  }
};

export const drawBarricades = (ctx: CanvasRenderingContext2D, state: State): void => {
  for (let slot = 0; slot < BARRICADE_SLOTS; slot += 1) drawBarricade(ctx, state, slot);
};

export const drawStampShadow = (ctx: CanvasRenderingContext2D, state: State): void => {
  const { stamp } = state;
  if (stamp.landsAt === NOT_SCHEDULED) return;
  const progress = 1 - (stamp.landsAt - state.tick) / STAMP_WARNING;
  ctx.globalAlpha = 0.25 + progress * 0.5;
  ctx.fillStyle = PALETTE.stampShadow;
  ctx.beginPath();
  ctx.arc(stamp.x / SUB, stamp.y / SUB, STAMP_RADIUS * (0.6 + progress * 0.4), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
};

export const drawSitIn = (
  ctx: CanvasRenderingContext2D,
  state: State,
  width: number,
  height: number,
): void => {
  if (!sitInActive(state)) return;
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = PALETTE.roach;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
};
