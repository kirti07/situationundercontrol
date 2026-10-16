import { h } from '../dom.ts';
import { icon } from '../ui/icons.ts';

const COUNTDOWN_FROM = 3;
const COUNT_MS = 650;

export interface PauseOverlay {
  readonly element: HTMLElement;
  readonly pause: () => void;
  readonly dispose: () => void;
}

export const createPauseOverlay = (
  setRunning: (running: boolean) => void,
  quit: () => void,
  settings: readonly HTMLElement[],
): PauseOverlay => {
  const count = h('p', { className: 'pause__count', attrs: { 'aria-live': 'assertive' } });
  const resume = h('button', { className: 'cta cta--light', attrs: { type: 'button' } }, [
    h('span', { text: 'Resume' }),
  ]);
  const leave = h(
    'button',
    { className: 'link-button link-button--light', attrs: { type: 'button' }, onClick: quit },
    [icon('back'), h('span', { text: 'Leave for the front page' })],
  );
  const actions = h('div', { className: 'pause__actions' }, [resume, ...settings, leave]);
  const element = h(
    'div',
    { className: 'pause', attrs: { hidden: '', role: 'dialog', 'aria-label': 'Paused' } },
    [h('p', { className: 'pause__title', text: 'Paused' }), actions, count],
  );
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
    actions.hidden = true;
    tickDown(COUNTDOWN_FROM);
  });

  return {
    element,
    pause: () => {
      if (!element.hidden && !actions.hidden) return;
      window.clearTimeout(timer);
      setRunning(false);
      count.textContent = '';
      actions.hidden = false;
      element.hidden = false;
      resume.focus();
    },
    dispose: () => {
      window.clearTimeout(timer);
    },
  };
};
