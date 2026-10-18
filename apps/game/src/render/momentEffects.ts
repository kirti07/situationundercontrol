import { EventKind, momentResult, MomentKind, Outcome, TICKS_PER_SECOND } from '@suc/sim';
import { drawPill, drawStamp, PILLS } from './labels.ts';
import type { Painter } from './painter.ts';
import { PALETTE } from './palette.ts';

const BANNER = { x: 180, y: 210 } as const;

type PainterTable = Readonly<Partial<Record<number, Painter>>>;

const ring = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
};

const RESULT_PILLS: Readonly<Partial<Record<number, readonly [string, keyof typeof PILLS]>>> = {
  [momentResult(MomentKind.Placard, Outcome.Won)]: ['CAMERAMAN DEFECTS · CROWD JOINS', 'swarm'],
  [momentResult(MomentKind.Placard, Outcome.Lost)]: ['THE LIE IS TRENDING', 'alarm'],
};

export const MOMENT_PAINTERS: PainterTable = {
  [EventKind.Caught]: {
    life: 1300,
    draw: (ctx, x, y, stamped) => {
      if (stamped === 1) {
        drawPill(ctx, BANNER.x, BANNER.y, 'MASTERSTROKE! THEY STAMPED THEIR OWN MAN', PILLS.alarm);
        return;
      }
      drawStamp(ctx, x, y - 24, 'PLAINCLOTHES', 'SUS!', PALETTE.red);
    },
  },
  [EventKind.WrongAccuse]: {
    life: 1300,
    draw: (ctx, x, y, left) => {
      drawPill(ctx, x, y - 30, `COMRADE OFFENDED · ${String(left)} WENT HOME`, PILLS.alarm);
    },
  },
  [EventKind.Pinpointed]: {
    life: 900,
    draw: (ctx, x, y) => {
      drawPill(ctx, x, y - 70, 'PINPOINTED · THE FAKE RADIOED IN', PILLS.alarm);
    },
  },
  [EventKind.Surge]: {
    life: 1400,
    draw: (ctx, _x, _y, ticks) => {
      const seconds = String(Math.round(ticks / TICKS_PER_SECOND));
      drawPill(ctx, BANNER.x, BANNER.y + 24, `SURGE! FULL PACE +${seconds} S`, PILLS.swarm);
    },
  },
  [EventKind.MomentResult]: {
    life: 1500,
    draw: (ctx, _x, _y, value) => {
      const pill = RESULT_PILLS[value];
      if (!pill) return;
      drawPill(ctx, BANNER.x, BANNER.y + 48, pill[0], PILLS[pill[1]]);
    },
  },
  [EventKind.PerfectSitIn]: {
    life: 1500,
    draw: (ctx, x, y, joiners) => {
      drawPill(ctx, x, y - 50, `PERFECT SIT-IN · +${String(joiners)} JOIN`, PILLS.swarm);
    },
  },
  [EventKind.Bounce]: {
    life: 600,
    draw: (ctx, x, y, _value, age) => {
      ctx.strokeStyle = PALETTE.marigold;
      ctx.lineWidth = 3;
      ring(ctx, x, y, 20 + age * 40);
      drawPill(ctx, x, y - 30, 'BOUNCED', PILLS.swarm);
    },
  },
};
