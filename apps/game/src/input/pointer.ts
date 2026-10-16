import { POINTERS } from '@suc/sim';
import { toWorld, type WorldPoint } from '../render/viewport.ts';

export interface PointerHandlers {
  readonly press: (slot: number, point: WorldPoint) => void;
  readonly move: (slot: number, point: WorldPoint) => void;
  readonly release: (slot: number) => void;
}

export const bindPointers = (
  canvas: HTMLCanvasElement,
  handlers: PointerHandlers,
  signal: AbortSignal,
): void => {
  const slots = new Map<number, number>();
  const freeSlot = (): number | undefined =>
    Array.from({ length: POINTERS }, (_, slot) => slot).find(
      (slot) => ![...slots.values()].includes(slot),
    );

  const onDown = (event: PointerEvent): void => {
    const slot = freeSlot();
    if (slot === undefined) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    slots.set(event.pointerId, slot);
    handlers.press(slot, toWorld(canvas, event.clientX, event.clientY));
  };

  const onMove = (event: PointerEvent): void => {
    const slot = slots.get(event.pointerId);
    if (slot === undefined) return;
    handlers.move(slot, toWorld(canvas, event.clientX, event.clientY));
  };

  const onUp = (event: PointerEvent): void => {
    const slot = slots.get(event.pointerId);
    if (slot === undefined) return;
    slots.delete(event.pointerId);
    handlers.release(slot);
  };

  const options = { signal };
  canvas.addEventListener('pointerdown', onDown, options);
  canvas.addEventListener('pointermove', onMove, options);
  canvas.addEventListener('pointerup', onUp, options);
  canvas.addEventListener('pointercancel', onUp, options);
};
