import { Side, type State } from '@suc/sim';
import { CHARACTERS } from '../content/roster.ts';
import { h } from '../dom.ts';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const ENTRANCE: Keyframe[] = [
  { opacity: 0, transform: 'translateY(4px)' },
  { opacity: 1, transform: 'none' },
];

export interface CaptionStrip {
  readonly element: HTMLElement;
  readonly show: (line: string) => void;
}

const PORTRAIT: Readonly<Record<Side, (state: State) => readonly HTMLElement[]>> = {
  [Side.Agency]: (state) => [
    h('img', {
      className: 'caption-strip__portrait',
      attrs: { src: CHARACTERS[state.character].art, alt: '', width: '48', height: '64' },
    }),
  ],
  [Side.Cockroach]: () => [],
};

export const createCaptionStrip = (state: State): CaptionStrip => {
  const text = h('p', { className: 'caption-strip__text', attrs: { 'aria-live': 'polite' } });
  const element = h('div', { className: 'caption-strip' }, [...PORTRAIT[state.side](state), text]);
  return {
    element,
    show: (line) => {
      text.textContent = line;
      if (reducedMotion.matches) return;
      text.animate(ENTRANCE, { duration: 360, easing: 'ease-out' });
    },
  };
};
