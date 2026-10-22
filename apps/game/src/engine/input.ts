import type { Input } from '../core/player.ts';

type Action = 'left' | 'right' | 'jump' | 'pause';

const KEYS: Readonly<Record<string, Action>> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  KeyP: 'pause',
  Escape: 'pause',
};

const PAD_DEADZONE_PX = 12;

const direction = (left: boolean, right: boolean): Input['move'] => {
  if (left === right) return 0;
  return right ? 1 : -1;
};

export interface Controls {
  readonly read: () => Input;
  readonly onPause: (handler: () => void) => void;
  readonly bindTouch: (pad: HTMLElement, jump: HTMLElement) => void;
  readonly dispose: () => void;
}

export const createControls = (): Controls => {
  const held = new Set<Action>();
  let padMove: Input['move'] = 0;
  let touchJump = false;
  let pause = (): void => undefined;
  const key = (down: boolean) => (event: KeyboardEvent) => {
    const action = KEYS[event.code];
    if (action === undefined) return;
    event.preventDefault();
    if (action === 'pause' && down && !event.repeat) pause();
    if (down) held.add(action);
    else held.delete(action);
  };
  const onDown = key(true);
  const onUp = key(false);
  const clear = (): void => {
    held.clear();
  };
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  window.addEventListener('blur', clear);
  const padFrom = (pad: HTMLElement) => (event: PointerEvent) => {
    const rect = pad.getBoundingClientRect();
    const offset = event.clientX - (rect.left + rect.width / 2);
    padMove = Math.abs(offset) < PAD_DEADZONE_PX ? 0 : direction(offset < 0, offset > 0);
  };
  const bindTouch = (pad: HTMLElement, jump: HTMLElement): void => {
    const move = padFrom(pad);
    pad.addEventListener('pointerdown', (event) => {
      pad.setPointerCapture(event.pointerId);
      move(event);
    });
    pad.addEventListener('pointermove', (event) => {
      if (pad.hasPointerCapture(event.pointerId)) move(event);
    });
    const release = (): void => {
      padMove = 0;
    };
    pad.addEventListener('pointerup', release);
    pad.addEventListener('pointercancel', release);
    jump.addEventListener('pointerdown', () => {
      touchJump = true;
    });
    for (const type of ['pointerup', 'pointercancel', 'pointerleave'] as const) {
      jump.addEventListener(type, () => {
        touchJump = false;
      });
    }
  };
  return {
    read: () => ({
      move: padMove === 0 ? direction(held.has('left'), held.has('right')) : padMove,
      jump: touchJump || held.has('jump'),
    }),
    onPause: (handler) => {
      pause = handler;
    },
    bindTouch,
    dispose: () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', clear);
    },
  };
};
