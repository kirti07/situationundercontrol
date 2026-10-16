import { FIELD_HEIGHT, FIELD_WIDTH, METRO_Y } from '@suc/sim';
import { MAP_FRAME, type Art } from './art.ts';
import { FONTS, PALETTE } from './palette.ts';

const ARCH_GLOW = { x: 150, y: 112, w: 62, h: 64 } as const;
const CONCOURSE = { y: METRO_Y - 12, h: 24 } as const;

const drawConcourse = (ctx: CanvasRenderingContext2D): void => {
  ctx.fillStyle = PALETTE.night2;
  ctx.fillRect(0, CONCOURSE.y, FIELD_WIDTH, CONCOURSE.h);
  ctx.fillStyle = PALETTE.sodium;
  ctx.fillRect(0, CONCOURSE.y, FIELD_WIDTH, 1);
  ctx.beginPath();
  ctx.arc(70, METRO_Y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.night;
  ctx.font = `700 9px ${FONTS.ui}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', 70, METRO_Y + 0.5);
  ctx.fillStyle = PALETTE.sodium;
  ctx.font = `400 8px ${FONTS.dateline}`;
  ctx.textAlign = 'left';
  ctx.fillText('CENTRAL SECRETARIAT METRO', 82, METRO_Y + 0.5);
};

export const drawBackdrop = (ctx: CanvasRenderingContext2D, art: Art, archLit: boolean): void => {
  ctx.fillStyle = PALETTE.night;
  ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
  ctx.drawImage(art.map, MAP_FRAME.x, MAP_FRAME.y, MAP_FRAME.w, MAP_FRAME.h);
  ctx.globalAlpha = archLit ? 0 : 0.62;
  ctx.fillStyle = PALETTE.night;
  ctx.fillRect(ARCH_GLOW.x, ARCH_GLOW.y, ARCH_GLOW.w, ARCH_GLOW.h);
  ctx.globalAlpha = 1;
  drawConcourse(ctx);
};
