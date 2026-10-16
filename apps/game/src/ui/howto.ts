import type { Side } from '@suc/sim';
import { HOW_TO } from '../content/howto.ts';
import { SIDE_CLASS } from '../content/sides.ts';
import { h } from '../dom.ts';
import { icon } from './icons.ts';

export const keyList = (side: Side): HTMLElement =>
  h(
    'dl',
    { className: 'keys' },
    HOW_TO[side].keys.map(([key, action]) =>
      h('div', { className: 'keys__row' }, [
        h('dt', {}, [h('kbd', { text: key })]),
        h('dd', { text: action }),
      ]),
    ),
  );

export const howToPanel = (side: Side): HTMLElement => {
  const content = HOW_TO[side];
  return h('section', { className: `howto-panel howto-panel--${SIDE_CLASS[side]}` }, [
    h('h2', { className: 'howto-panel__title' }, [
      icon(content.icon),
      h('span', { text: content.title }),
    ]),
    h(
      'ol',
      { className: 'howto-panel__lines' },
      content.lines.map((line) => h('li', { text: line })),
    ),
    keyList(side),
  ]);
};
