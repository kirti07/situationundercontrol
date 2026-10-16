import { FIELD_HEIGHT, FIELD_WIDTH } from '@suc/sim';

const MAX_DPR = 2;

export interface WorldPoint {
  readonly x: number;
  readonly y: number;
}

export const fitCanvas = (canvas: HTMLCanvasElement): number => {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  return canvas.width / FIELD_WIDTH;
};

const clamp = (value: number, max: number): number => Math.min(max, Math.max(0, Math.round(value)));

export const toWorld = (
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): WorldPoint => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clamp(((clientX - rect.left) / rect.width) * FIELD_WIDTH, FIELD_WIDTH),
    y: clamp(((clientY - rect.top) / rect.height) * FIELD_HEIGHT, FIELD_HEIGHT),
  };
};
