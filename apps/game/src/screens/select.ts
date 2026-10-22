import policeArt from '../assets/art/police-walk.webp';
import primeTimeArt from '../assets/art/prime-time.webp';
import publicServantArt from '../assets/art/public-servant.webp';
import { type CharacterId, CHARACTERS } from '../content/roles.ts';
import { button, el, image } from '../dom.ts';
import type { Navigate, ScreenFactory } from '../router.ts';

interface Card {
  readonly id: CharacterId;
  readonly office: string;
  readonly art: string;
  readonly collects: string;
  readonly note: string;
}

const CARDS: readonly Card[] = [
  {
    id: 'media',
    office: 'THE ANCHOR',
    art: primeTimeArt,
    collects: 'Money for the media house',
    note: 'Bonus: FAKE NEWS headlines. Grab one to run it.',
  },
  {
    id: 'publicServant',
    office: 'THE TOP OFFICE',
    art: publicServantArt,
    collects: 'Money for the PM Cares fund',
    note: 'His donation box fills as you go. A floatier fall.',
  },
  {
    id: 'police',
    office: 'THE FORCE',
    art: policeArt,
    collects: 'Medals',
    note: 'His energy runs down. Chai and samosas top it up.',
  },
];

const card = (navigate: Navigate, data: Card): HTMLElement => {
  const node = button('duty', '', () => {
    navigate('play', { side: 'agency', character: data.id });
  });
  const text = el('span', 'duty__text');
  text.append(
    el('span', 'duty__office', data.office),
    el('span', 'duty__name', CHARACTERS[data.id].name),
    el('span', 'duty__collects', data.collects),
    el('span', 'duty__note', data.note),
    el('span', 'duty__play', 'On duty →'),
  );
  node.append(image('duty__art', data.art, CHARACTERS[data.id].name), text);
  return node;
};

export const selectScreen: ScreenFactory<'select'> = (navigate) => {
  const root = el('section', 'select');
  const head = el('header', 'select__head');
  head.append(
    el('h1', 'select__title', "Who's on duty tonight?"),
    button('select__back', '← Back to sides', () => {
      navigate('home');
    }),
  );
  const cards = el('div', 'select__cards');
  cards.append(...CARDS.map((data) => card(navigate, data)));
  root.append(
    head,
    cards,
    el('p', 'select__soon', 'All three avoid the same thing: the burning issues.'),
  );
  return { root };
};
