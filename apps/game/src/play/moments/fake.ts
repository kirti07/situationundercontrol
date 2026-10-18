import type { State } from '@suc/sim';
import { FAKE_TELLS_TEXT } from '../../content/moments.ts';
import { h } from '../../dom.ts';
import { countdown, type MomentView } from './view.ts';

export const fakeView = (state: State): MomentView => {
  const timer = countdown();
  const tell = FAKE_TELLS_TEXT[state.moment.cards[0] ?? 0]?.name ?? '';
  return {
    element: h('section', { className: 'moment moment--banner' }, [
      h('h2', { className: 'moment__title', text: 'Find the fake protester!' }),
      h('p', { className: 'moment__hint', text: `Tap the one with ${tell}.` }),
      timer.element,
    ]),
    update: timer.update,
  };
};
