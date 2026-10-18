import { METRO_Y } from '@suc/sim';
import type { Painter } from './painter.ts';
import { FONTS, PALETTE } from './palette.ts';

const LIFE_MS = 900;
const FLIGHT = 0.6;
const TRAIL = 0.25;
const ARC_HEIGHT = 30;
const LANDING_Y = METRO_Y - 14;
const SPREAD: readonly number[] = [-26, 0, 26];

interface Point {
  readonly x: number;
  readonly y: number;
}

const easeOut = (t: number): number => 1 - (1 - t) * (1 - t);

const pointOnArc = (from: Point, toX: number, t: number): Point => ({
  x: from.x + (toX - from.x) * t,
  y: from.y + (METRO_Y - from.y) * t - Math.sin(Math.PI * t) * ARC_HEIGHT,
});

const drawStreak = (ctx: CanvasRenderingContext2D, from: Point, toX: number, t: number): void => {
  const head = pointOnArc(from, toX, easeOut(t));
  const tail = pointOnArc(from, toX, easeOut(Math.max(0, t - TRAIL)));
  ctx.beginPath();
  ctx.moveTo(tail.x, tail.y);
  ctx.lineTo(head.x, head.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(head.x, head.y, 2, 0, Math.PI * 2);
  ctx.fill();
};

const drawLanding = (ctx: CanvasRenderingContext2D, x: number): void => {
  ctx.font = `700 11px ${FONTS.ui}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+3', x, LANDING_Y);
};

const moving = (ctx: CanvasRenderingContext2D, from: Point, age: number): void => {
  const t = Math.min(1, age / FLIGHT);
  for (const offset of SPREAD) drawStreak(ctx, from, from.x + offset, t);
  if (age >= FLIGHT) drawLanding(ctx, from.x);
};

const still = (ctx: CanvasRenderingContext2D, from: Point): void => {
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(from.x, LANDING_Y - 8);
  ctx.stroke();
  ctx.setLineDash([]);
  drawLanding(ctx, from.x);
};

export const backfirePainter = (reducedMotion: () => boolean): Painter => ({
  life: LIFE_MS,
  draw: (ctx, x, y, _generation, age) => {
    ctx.strokeStyle = PALETTE.red;
    ctx.fillStyle = PALETTE.red;
    ctx.lineWidth = 1.5;
    const from = { x, y };
    if (reducedMotion()) {
      still(ctx, from);
      return;
    }
    moving(ctx, from, age);
  },
});
