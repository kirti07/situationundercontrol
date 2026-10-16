import {
  EVENT_STRIDE,
  EventKind,
  FREEZE_DURATION,
  FREEZE_RADIUS,
  SUB,
  TICKS_PER_SECOND,
  type State,
} from '@suc/sim';
import { drawPill, drawStamp, PILLS } from './labels.ts';
import { at } from './typed.ts';
import { PALETTE } from './palette.ts';

const CAPACITY = 64;
const BANNER = { x: 180, y: 150 } as const;
const MS_PER_TICK = 1000 / TICKS_PER_SECOND;

interface Pool {
  readonly kind: Int8Array;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly value: Int32Array;
  readonly born: Float64Array;
  next: number;
}

interface Painter {
  readonly life: number;
  readonly draw: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    value: number,
    age: number,
  ) => void;
}

export interface EffectLabels {
  readonly power: string;
}

const ring = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
): void => {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
};

const painters = (labels: EffectLabels): Readonly<Partial<Record<number, Painter>>> => ({
  [EventKind.Tap]: {
    life: 700,
    draw: (ctx, x, y, hits, age) => {
      if (hits === 0) {
        ring(ctx, x, y, 8 + age * 16, PALETTE.newsprint);
        return;
      }
      drawStamp(ctx, x, y - 22, 'SMASHED', `${String(hits)} → ${String(hits * 3)}`, PALETTE.agency);
    },
  },
  [EventKind.Muted]: {
    life: 600,
    draw: (ctx, x, y) => {
      drawPill(ctx, x, y - 16, 'MIC IS ON · NO SMASHING', PILLS.alarm);
    },
  },
  [EventKind.StampLand]: {
    life: 1200,
    draw: (ctx, x, y, hits) => {
      drawPill(ctx, x, y - 30, `Lathi charge! +${String(hits * 2)} joined`, PILLS.news, -0.06);
    },
  },
  [EventKind.Climb]: {
    life: 1400,
    draw: (ctx, _x, y) => {
      drawPill(ctx, BANNER.x, y - 18, 'Over the barricade!', PILLS.rally);
    },
  },
  [EventKind.Backfire]: {
    life: 1800,
    draw: (ctx, _x, _y, count) => {
      drawPill(
        ctx,
        BANNER.x,
        BANNER.y + 40,
        `Gone viral · +${String(count)} from six roads`,
        PILLS.alarm,
      );
    },
  },
  [EventKind.Power]: {
    life: 1800,
    draw: (ctx) => {
      drawPill(ctx, BANNER.x, BANNER.y + 18, labels.power.toUpperCase(), PILLS.agency);
    },
  },
  [EventKind.Freeze]: {
    life: FREEZE_DURATION * MS_PER_TICK,
    draw: (ctx, x, y, _count, age) => {
      ctx.globalAlpha = Math.min(1, (1 - age) * 3);
      ctx.setLineDash([4, 4]);
      ring(ctx, x, y, FREEZE_RADIUS, PALETTE.frozen);
      ctx.setLineDash([]);
      drawStamp(ctx, x, y, 'BRANDED', 'ANTI-NATIONAL', PALETTE.red);
    },
  },
  [EventKind.SitIn]: {
    life: 1600,
    draw: (ctx) => {
      drawPill(ctx, BANNER.x, BANNER.y + 18, 'SIT-IN · UNTOUCHABLE', PILLS.rally);
    },
  },
  [EventKind.Enter]: {
    life: 420,
    draw: (ctx, x, y, _value, age) => {
      ring(ctx, x, y, 6 + age * 10, PALETTE.sodium);
    },
  },
});

export interface Effects {
  readonly ingest: (state: State, now: number) => void;
  readonly draw: (ctx: CanvasRenderingContext2D, now: number) => void;
}

export const createEffects = (labels: EffectLabels): Effects => {
  const table = painters(labels);
  const pool: Pool = {
    kind: new Int8Array(CAPACITY),
    x: new Float32Array(CAPACITY),
    y: new Float32Array(CAPACITY),
    value: new Int32Array(CAPACITY),
    born: new Float64Array(CAPACITY).fill(-Infinity),
    next: 0,
  };

  const add = (state: State, offset: number, now: number): void => {
    const kind = at(state.events, offset);
    if (!table[kind]) return;
    const slot = pool.next;
    pool.kind[slot] = kind;
    pool.x[slot] = at(state.events, offset + 1) / SUB;
    pool.y[slot] = at(state.events, offset + 2) / SUB;
    pool.value[slot] = at(state.events, offset + 3);
    pool.born[slot] = now;
    pool.next = (slot + 1) % CAPACITY;
  };

  const paint = (ctx: CanvasRenderingContext2D, slot: number, now: number): void => {
    const painter = table[at(pool.kind, slot)];
    if (!painter) return;
    const age = (now - at(pool.born, slot)) / painter.life;
    if (age >= 1) return;
    ctx.globalAlpha = age > 0.75 ? (1 - age) * 4 : 1;
    painter.draw(ctx, at(pool.x, slot), at(pool.y, slot), at(pool.value, slot), age);
  };

  return {
    ingest: (state, now) => {
      for (let i = 0; i < state.eventCount; i += 1) add(state, i * EVENT_STRIDE, now);
    },
    draw: (ctx, now) => {
      for (let slot = 0; slot < CAPACITY; slot += 1) paint(ctx, slot, now);
      ctx.globalAlpha = 1;
    },
  };
};
