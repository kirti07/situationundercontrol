import { TICKS_PER_SECOND } from '../content/tuning.ts';

const STEP_MS = 1000 / TICKS_PER_SECOND;
const MAX_STEPS_PER_FRAME = 4;

export interface Loop {
  readonly stop: () => void;
}

export const startLoop = (tick: () => void, draw: () => void): Loop => {
  let last = performance.now();
  let carry = 0;
  let frame = 0;
  const run = (now: number): void => {
    carry = Math.min(carry + now - last, STEP_MS * MAX_STEPS_PER_FRAME);
    last = now;
    while (carry >= STEP_MS) {
      tick();
      carry -= STEP_MS;
    }
    draw();
    frame = requestAnimationFrame(run);
  };
  const resync = (): void => {
    last = performance.now();
    carry = 0;
  };
  document.addEventListener('visibilitychange', resync);
  frame = requestAnimationFrame(run);
  return {
    stop: () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', resync);
    },
  };
};
