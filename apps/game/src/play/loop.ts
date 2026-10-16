import { TICKS_PER_SECOND } from '@suc/sim';

const STEP_MS = 1000 / TICKS_PER_SECOND;
const MAX_STEPS_PER_FRAME = 5;

export interface LoopHooks {
  readonly tick: () => boolean;
  readonly frame: (alpha: number, now: number) => void;
  readonly finished: () => void;
}

export interface Loop {
  readonly start: () => void;
  readonly stop: () => void;
  readonly setRunning: (running: boolean) => void;
}

export const createLoop = (hooks: LoopHooks): Loop => {
  let handle = 0;
  let last = 0;
  let accumulator = 0;
  let alpha = 0;
  let running = false;
  let alive = true;

  const simulate = (elapsed: number): void => {
    accumulator = Math.min(accumulator + elapsed, STEP_MS * MAX_STEPS_PER_FRAME);
    while (alive && accumulator >= STEP_MS) {
      accumulator -= STEP_MS;
      alive = hooks.tick();
    }
    if (!alive) hooks.finished();
  };

  const onFrame = (now: number): void => {
    const elapsed = now - last;
    last = now;
    if (running) {
      simulate(elapsed);
      alpha = accumulator / STEP_MS;
    }
    hooks.frame(alpha, now);
    handle = alive ? requestAnimationFrame(onFrame) : 0;
  };

  return {
    start: () => {
      running = true;
      last = performance.now();
      handle = requestAnimationFrame(onFrame);
    },
    stop: () => {
      alive = false;
      cancelAnimationFrame(handle);
    },
    setRunning: (next) => {
      running = next;
      accumulator = 0;
    },
  };
};
