import type { State } from '@suc/sim';
import { h } from '../../dom.ts';

export interface MomentView {
  readonly element: HTMLElement;
  readonly update: (state: State) => void;
}

export const countdown = (): MomentView => {
  const fill = h('span', { className: 'moment__timer-fill' });
  return {
    element: h('span', { className: 'moment__timer', attrs: { 'aria-hidden': 'true' } }, [fill]),
    update: (state) => {
      const { opensAt, closesAt } = state.moment;
      const left = Math.max(0, closesAt - state.tick) / Math.max(1, closesAt - opensAt);
      fill.style.transform = `scaleX(${String(left)})`;
    },
  };
};

export const optionButton = (key: number, label: string, onClick: () => void): HTMLElement =>
  h('button', { className: 'moment__option', attrs: { type: 'button' }, onClick }, [
    h('span', {
      className: 'moment__key',
      text: String(key + 1),
      attrs: { 'aria-hidden': 'true' },
    }),
    h('span', { className: 'moment__label', text: label }),
  ]);
