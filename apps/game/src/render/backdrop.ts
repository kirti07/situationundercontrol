import {
  ARCH,
  BRIDGES,
  CANALS,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  LAWNS,
  OPEN_GROUND,
  ROADS,
  type Rect,
} from '@suc/sim';
import { PALETTE } from './palette.ts';

const fillRects = (ctx: CanvasRenderingContext2D, rects: readonly Rect[], color: string): void => {
  ctx.fillStyle = color;
  for (const rect of rects) ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
};

const drawRoads = (ctx: CanvasRenderingContext2D): void => {
  ctx.fillStyle = PALETTE.road;
  for (const road of ROADS) {
    ctx.beginPath();
    ctx.arc(road.x, road.y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
};

export const drawBackdrop = (ctx: CanvasRenderingContext2D, archLit: boolean): void => {
  ctx.fillStyle = PALETTE.night;
  ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
  fillRects(ctx, OPEN_GROUND, PALETTE.ground);
  fillRects(ctx, LAWNS, PALETTE.lawn);
  fillRects(ctx, CANALS, PALETTE.water);
  fillRects(ctx, BRIDGES, PALETTE.bridge);
  drawRoads(ctx);
  fillRects(ctx, [ARCH], archLit ? PALETTE.archLit : PALETTE.arch);
};
