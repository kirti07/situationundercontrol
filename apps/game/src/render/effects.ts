import { EVENT_STRIDE, EventKind, SUB, type State } from '@suc/sim';
import { PALETTE } from './palette.ts';

const CAPACITY = 96;
const LIFETIME_MS = 420;

interface Effects {
  readonly kind: Int8Array;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly born: Float64Array;
  next: number;
}

const STYLE: Readonly<Record<number, { color: string; radius: number }>> = {
  [EventKind.Tap]: { color: PALETTE.miss, radius: 24 },
  [EventKind.Smash]: { color: PALETTE.agency, radius: 30 },
  [EventKind.Enter]: { color: PALETTE.archLit, radius: 18 },
  [EventKind.StampLand]: { color: PALETTE.agency, radius: 40 },
  [EventKind.Muted]: { color: PALETTE.muted, radius: 16 },
};

export const createEffects = (): Effects => ({
  kind: new Int8Array(CAPACITY),
  x: new Float32Array(CAPACITY),
  y: new Float32Array(CAPACITY),
  born: new Float64Array(CAPACITY).fill(-Infinity),
  next: 0,
});

export const ingestEvents = (effects: Effects, state: State, now: number): void => {
  for (let i = 0; i < state.eventCount; i += 1) {
    const at = i * EVENT_STRIDE;
    const slot = effects.next;
    effects.kind[slot] = state.events[at] ?? 0;
    effects.x[slot] = (state.events[at + 1] ?? 0) / SUB;
    effects.y[slot] = (state.events[at + 2] ?? 0) / SUB;
    effects.born[slot] = now;
    effects.next = (slot + 1) % CAPACITY;
  }
};

const drawEffect = (
  ctx: CanvasRenderingContext2D,
  effects: Effects,
  slot: number,
  age: number,
  reduced: boolean,
): void => {
  const style = STYLE[effects.kind[slot] ?? 0];
  if (age >= 1 || !style) return;
  const grow = reduced ? 1 : 0.4 + age * 0.6;
  ctx.globalAlpha = 1 - age;
  ctx.strokeStyle = style.color;
  ctx.beginPath();
  ctx.arc(effects.x[slot] ?? 0, effects.y[slot] ?? 0, style.radius * grow, 0, Math.PI * 2);
  ctx.stroke();
};

export const drawEffects = (
  ctx: CanvasRenderingContext2D,
  effects: Effects,
  now: number,
  reduced: boolean,
): void => {
  ctx.lineWidth = 3;
  for (let slot = 0; slot < CAPACITY; slot += 1) {
    drawEffect(ctx, effects, slot, (now - (effects.born[slot] ?? 0)) / LIFETIME_MS, reduced);
  }
  ctx.globalAlpha = 1;
};
