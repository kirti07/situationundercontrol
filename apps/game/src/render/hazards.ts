import {
  BARRICADE_SLOTS,
  FIELD_WIDTH,
  LANES,
  NOT_SCHEDULED,
  PINPOINT_RADIUS,
  STAMP_RADIUS,
  STAMP_WARNING,
  SUB,
  sitInActive,
  type State,
} from '@suc/sim';
import { MAP_FRAME } from './art.ts';
import { PALETTE } from './palette.ts';

const BARRICADE_DEPTH = 7;
const STRIPES = 6;

const drawBarricade = (ctx: CanvasRenderingContext2D, state: State, slot: number): void => {
  const lane = LANES[state.barricades.lane[slot] ?? -1];
  if (!lane) return;
  const y = (state.barricades.y[slot] ?? 0) / SUB - BARRICADE_DEPTH;
  const width = lane.maxX - lane.minX;
  const stripe = width / STRIPES;
  for (let i = 0; i < STRIPES; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? PALETTE.agency : PALETTE.newsprint;
    ctx.fillRect(lane.minX + i * stripe, y, stripe, BARRICADE_DEPTH);
  }
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1;
  ctx.strokeRect(lane.minX, y, width, BARRICADE_DEPTH);
};

export const drawBarricades = (ctx: CanvasRenderingContext2D, state: State): void => {
  for (let slot = 0; slot < BARRICADE_SLOTS; slot += 1) drawBarricade(ctx, state, slot);
};

export const drawStampWarning = (ctx: CanvasRenderingContext2D, state: State): void => {
  const { stamp } = state;
  if (stamp.landsAt === NOT_SCHEDULED) return;
  const progress = 1 - (stamp.landsAt - state.tick) / STAMP_WARNING;
  const x = stamp.x / SUB;
  const y = stamp.y / SUB;
  const radius = stamp.wide ? PINPOINT_RADIUS : STAMP_RADIUS;
  ctx.fillStyle = PALETTE.shadow;
  ctx.globalAlpha = 0.4 + progress * 0.5;
  ctx.beginPath();
  ctx.arc(x, y, radius * (0.55 + progress * 0.45), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = stamp.wide ? PALETTE.red : PALETTE.agency;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
};

export const drawSitIn = (ctx: CanvasRenderingContext2D, state: State): void => {
  if (!sitInActive(state)) return;
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = PALETTE.marigold;
  ctx.fillRect(0, MAP_FRAME.y, FIELD_WIDTH, MAP_FRAME.h);
  ctx.globalAlpha = 1;
};
