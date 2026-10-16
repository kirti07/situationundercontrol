import { Character, Side } from '@suc/sim';
import gateInk from '../assets/art/gate-ink.webp';
import officerArt from '../assets/art/officer.webp';
import roachArt from '../assets/art/roach-hero.webp';
import { FRONT_PAGE_CAPTIONS } from '../content/captions.ts';
import { SIDE_CLASS } from '../content/sides.ts';
import { h } from '../dom.ts';
import { todaysEdition } from '../edition.ts';
import type { Navigate, ScreenFactory } from '../router.ts';
import { icon } from '../ui/icons.ts';
import { editionDateLine, masthead } from '../ui/masthead.ts';

interface SideChoice {
  readonly side: Side;
  readonly title: string;
  readonly line: string;
  readonly art: string;
  readonly go: (navigate: Navigate) => void;
}

const CHOICES: readonly SideChoice[] = [
  {
    side: Side.Cockroach,
    title: 'Be the Cockroaches',
    line: 'March up Kartavya Path',
    art: roachArt,
    go: (navigate) => {
      navigate('play', { side: Side.Cockroach, character: Character.None });
    },
  },
  {
    side: Side.Agency,
    title: 'Join the Agency',
    line: 'Keep the arch clear. Good luck.',
    art: officerArt,
    go: (navigate) => {
      navigate('roster', undefined);
    },
  },
];

const INVITES: Readonly<Record<Side, string>> = {
  [Side.Agency]: 'A friend held India Gate for the Agency. Your turn.',
  [Side.Cockroach]: 'A friend marched with the cockroaches. Your turn.',
};

const sideButton = (choice: SideChoice, navigate: Navigate, invited: boolean): HTMLButtonElement =>
  h(
    'button',
    {
      className: `side-card side-card--${SIDE_CLASS[choice.side]}`,
      attrs: { type: 'button', 'data-invited': String(invited) },
      onClick: () => {
        choice.go(navigate);
      },
    },
    [
      h('span', { className: 'side-card__badge' }, [
        h('img', {
          attrs: { src: choice.art, alt: '', width: '64', height: '64', decoding: 'async' },
        }),
      ]),
      h('span', { className: 'side-card__text' }, [
        h('span', { className: 'side-card__title', text: choice.title }),
        h('span', { className: 'side-card__line', text: choice.line }),
      ]),
      icon('arrow', 'icon side-card__arrow'),
    ],
  );

const inviteNote = (side: Side): HTMLElement =>
  h('p', { className: 'front__invite', text: INVITES[side] });

const story = (): HTMLElement =>
  h('article', { className: 'front__story' }, [
    h('p', { className: 'kicker', text: 'Tonight at India Gate' }),
    h('h2', { className: 'front__story-head', text: 'Every smash makes three more' }),
    h('p', {
      text: 'The cockroaches come up from Central Secretariat metro at 5:30 PM and walk Kartavya Path toward the arch. The Agency has until 9 PM, a rubber stamp and three senior officials.',
    }),
    h('p', {
      text: 'Officials insist the situation is under control. The pigeon on the arch declined to confirm.',
    }),
  ]);

const gatePanel = (caption: string): HTMLElement =>
  h('figure', { className: 'ink-panel front__panel' }, [
    h('img', {
      className: 'ink-panel__art',
      attrs: {
        src: gateInk,
        alt: 'India Gate in pen and ink, with police barricades',
        fetchpriority: 'high',
      },
    }),
    h('figcaption', { className: 'ink-panel__caption', text: caption }),
  ]);

export const frontScreen: ScreenFactory<'front'> = (params, navigate) => {
  const edition = todaysEdition();
  const caption = FRONT_PAGE_CAPTIONS[edition.number % FRONT_PAGE_CAPTIONS.length] ?? '';
  const invite = params.invited === null ? [] : [inviteNote(params.invited)];
  const element = h('main', { className: 'screen screen--paper front' }, [
    h('div', { className: 'front__head' }, [editionDateLine(edition.number), masthead('large')]),
    gatePanel(caption),
    story(),
    h('section', { className: 'front__sides', attrs: { 'aria-label': 'Pick a side' } }, [
      h('h2', { className: 'kicker', text: 'Pick a side' }),
      ...invite,
      ...CHOICES.map((choice) => sideButton(choice, navigate, choice.side === params.invited)),
    ]),
    h('footer', { className: 'front__foot' }, [
      h('button', {
        className: 'link-button',
        text: 'How to play',
        attrs: { type: 'button' },
        onClick: () => {
          navigate('howto', undefined);
        },
      }),
      h('span', { text: 'A work of satire' }),
    ]),
  ]);
  return { element, unmount: () => undefined };
};
