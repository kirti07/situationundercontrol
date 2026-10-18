import { FONTS, PALETTE } from './palette.ts';

const SHINE = '#e9f2ff';
const KHAKI = '#c9b27a';

type DrawTell = (ctx: CanvasRenderingContext2D, facing: number) => void;

const shoes: DrawTell = (ctx) => {
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.ellipse(-5, -1, 4.5, 2.2, 0, 0, Math.PI * 2);
  ctx.ellipse(5, -1, 4.5, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = SHINE;
  ctx.fillRect(-7, -2.4, 2.5, 1);
  ctx.fillRect(3, -2.4, 2.5, 1);
};

const walkieTalkie: DrawTell = (ctx) => {
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(7, -18, 5, 9);
  ctx.fillRect(10, -24, 1.5, 6);
  ctx.fillStyle = PALETTE.red;
  ctx.fillRect(8, -16, 1.5, 1.5);
};

const phone: DrawTell = (ctx) => {
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(6, -26, 7, 11);
  ctx.fillStyle = SHINE;
  ctx.beginPath();
  ctx.arc(9.5, -23, 1.6, 0, Math.PI * 2);
  ctx.fill();
};

const moustache: DrawTell = (ctx) => {
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.ellipse(0, -22, 5, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
};

const placard: DrawTell = (ctx, facing) => {
  ctx.save();
  ctx.scale(facing, 1);
  ctx.fillStyle = PALETTE.newsprint;
  ctx.fillRect(-13, -44, 26, 10);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-13, -44, 26, 10);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `700 4px ${FONTS.ui}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SAB CHANGA SI', 0, -39);
  ctx.restore();
};

const kurta: DrawTell = (ctx) => {
  ctx.fillStyle = KHAKI;
  ctx.fillRect(-6, -17, 12, 10);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.lineTo(0, -9);
  ctx.stroke();
};

interface TellArt {
  readonly anchor: number;
  readonly draw: DrawTell;
}

const TELLS: readonly TellArt[] = [
  { anchor: -1, draw: shoes },
  { anchor: -15, draw: walkieTalkie },
  { anchor: -20, draw: phone },
  { anchor: -22, draw: moustache },
  { anchor: -39, draw: placard },
  { anchor: -12, draw: kurta },
];

const TELL_SCALE = 2;

export const drawTell = (ctx: CanvasRenderingContext2D, tell: number, facing: number): void => {
  const art = TELLS[tell];
  if (!art) return;
  ctx.save();
  ctx.translate(0, art.anchor);
  ctx.scale(TELL_SCALE, TELL_SCALE);
  ctx.translate(0, -art.anchor);
  art.draw(ctx, facing);
  ctx.restore();
};
