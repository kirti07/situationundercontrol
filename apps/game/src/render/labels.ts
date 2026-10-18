import { FONTS, PALETTE } from './palette.ts';

export interface PillStyle {
  readonly fill: string;
  readonly ink: string;
  readonly border: string;
  readonly size: number;
  readonly font: string;
}

export const PILLS = {
  swarm: {
    fill: PALETTE.marigold,
    ink: PALETTE.ink,
    border: PALETTE.ink,
    size: 8,
    font: FONTS.dateline,
  },
  news: {
    fill: PALETTE.newsprint,
    ink: PALETTE.ink,
    border: PALETTE.marigold,
    size: 9,
    font: FONTS.ui,
  },
  alarm: {
    fill: PALETTE.red,
    ink: PALETTE.newsprint,
    border: PALETTE.ink,
    size: 9,
    font: FONTS.ui,
  },
  agency: {
    fill: PALETTE.agency,
    ink: PALETTE.newsprint,
    border: PALETTE.ink,
    size: 9,
    font: FONTS.ui,
  },
} as const satisfies Record<string, PillStyle>;

const PAD_X = 6;
const HEIGHT_RATIO = 2;

export const drawPill = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  style: PillStyle,
  rotation = 0,
): void => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.font = `700 ${String(style.size)}px ${style.font}`;
  const width = ctx.measureText(text).width + PAD_X * 2;
  const height = style.size * HEIGHT_RATIO;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, height / 2);
  ctx.fillStyle = style.fill;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = style.border;
  ctx.stroke();
  ctx.fillStyle = style.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0.5);
  ctx.restore();
};

export const drawStamp = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  top: string,
  bottom: string,
  ink: string,
): void => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.14);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fillRect(-30, -17, 60, 34);
  ctx.lineWidth = 2;
  ctx.strokeStyle = ink;
  ctx.strokeRect(-30, -17, 60, 34);
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `400 8px ${FONTS.dateline}`;
  ctx.fillText(top, 0, -7);
  ctx.font = `900 13px ${FONTS.headline}`;
  ctx.fillText(bottom, 0, 7);
  ctx.restore();
};
