import { h } from '../dom.ts';

const COUNTDOWN_FROM = 3;
const COUNT_MS = 700;

export interface PauseOverlay {
  readonly element: HTMLElement;
  readonly pause: () => void;
  readonly dispose: () => void;
}

export const createPauseOverlay = (setRunning: (running: boolean) => void): PauseOverlay => {
  const count = h('p', { className: 'pause__count', attrs: { 'aria-live': 'assertive' } });
  const resume = h('button', {
    className: 'button button--primary',
    text: 'Resume',
    attrs: { type: 'button' },
  });
  const element = h('div', { className: 'pause', attrs: { hidden: '' } }, [
    h('p', { className: 'pause__title', text: 'Paused' }),
    resume,
    count,
  ]);
  let timer = 0;

  const tickDown = (remaining: number): void => {
    count.textContent = String(remaining);
    timer = window.setTimeout(() => {
      if (remaining > 1) {
        tickDown(remaining - 1);
        return;
      }
      element.hidden = true;
      setRunning(true);
    }, COUNT_MS);
  };

  resume.addEventListener('click', () => {
    resume.hidden = true;
    tickDown(COUNTDOWN_FROM);
  });

  return {
    element,
    pause: () => {
      window.clearTimeout(timer);
      setRunning(false);
      count.textContent = '';
      resume.hidden = false;
      element.hidden = false;
      resume.focus();
    },
    dispose: () => {
      window.clearTimeout(timer);
    },
  };
};
