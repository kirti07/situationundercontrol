import { SIDES_IN_ORDER } from '../content/howto.ts';
import { h } from '../dom.ts';
import type { ScreenFactory } from '../router.ts';
import { howToPanel } from '../ui/howto.ts';
import { icon } from '../ui/icons.ts';
import { masthead } from '../ui/masthead.ts';

export const howtoScreen: ScreenFactory<'howto'> = (_params, navigate) => {
  const element = h('main', { className: 'screen screen--paper howto' }, [
    masthead('small'),
    h('h1', { className: 'howto__title', text: 'How to play' }),
    h('p', {
      className: 'howto__lede',
      text: 'One evening at India Gate, 5:30 to 9:00 PM. One rule: every smash makes three more.',
    }),
    h('div', { className: 'howto__panels' }, SIDES_IN_ORDER.map(howToPanel)),
    h(
      'button',
      {
        className: 'cta cta--ink',
        attrs: { type: 'button' },
        onClick: () => {
          navigate('front', { invited: null });
        },
      },
      [icon('back'), h('span', { text: 'Back to the front page' })],
    ),
  ]);
  return { element, unmount: () => undefined };
};
