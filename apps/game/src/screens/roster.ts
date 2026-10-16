import { Side, type Character } from '@suc/sim';
import { AGENCY_ROSTER, CHARACTERS, DISCLAIMER } from '../content/roster.ts';
import { h } from '../dom.ts';
import type { ScreenFactory } from '../router.ts';
import { lastCharacter, rememberCharacter } from '../storage.ts';
import { icon } from '../ui/icons.ts';
import { dateline } from '../ui/masthead.ts';

const card = (character: Character, select: (character: Character) => void): HTMLButtonElement => {
  const info = CHARACTERS[character];
  return h(
    'button',
    {
      className: 'duty-card',
      attrs: { type: 'button', 'aria-pressed': 'false', 'data-character': String(character) },
      onClick: () => {
        select(character);
      },
    },
    [
      h('img', {
        className: 'duty-card__art',
        attrs: {
          src: info.art,
          alt: `${info.name}, a caricature`,
          width: '210',
          height: '280',
          decoding: 'async',
        },
      }),
      h('span', { className: 'duty-card__body' }, [
        h('span', { className: 'duty-card__head' }, [
          h('span', { className: 'duty-card__name', text: info.name }),
          h('span', { className: 'duty-card__office', text: info.office }),
        ]),
        h('span', { className: 'duty-card__power', text: info.power }),
        h('span', { className: 'duty-card__blurb', text: info.blurb }),
        h('span', { className: 'duty-card__backfire' }, [
          icon('replay', 'icon icon--small'),
          h('span', { text: info.backfire }),
        ]),
        h('span', { className: 'duty-card__quote', text: info.quote }),
      ]),
    ],
  );
};

export const rosterScreen: ScreenFactory<'roster'> = (_params, navigate) => {
  let chosen = lastCharacter();
  const label = h('span');
  const report = h(
    'button',
    {
      className: 'cta cta--agency',
      attrs: { type: 'button' },
      onClick: () => {
        rememberCharacter(chosen);
        navigate('play', { side: Side.Agency, character: chosen });
      },
    },
    [label, icon('arrow')],
  );
  const cards = AGENCY_ROSTER.map((character) =>
    card(character, (picked) => {
      chosen = picked;
      sync();
    }),
  );
  const sync = (): void => {
    for (const element of cards) {
      element.setAttribute('aria-pressed', String(element.dataset.character === String(chosen)));
    }
    label.textContent = `Report for duty as ${CHARACTERS[chosen].name}`;
  };
  sync();
  const element = h('main', { className: 'screen screen--paper roster' }, [
    h('div', { className: 'roster__top' }, [
      h(
        'button',
        {
          className: 'icon-button',
          attrs: { type: 'button', 'aria-label': 'Back to the front page' },
          onClick: () => {
            navigate('front', { invited: null });
          },
        },
        [icon('back')],
      ),
      dateline('Agency · Duty roster', '', 'Kartavya Path · 5:30 PM', true),
    ]),
    h('h1', { className: 'roster__title', text: "Who's on duty tonight?" }),
    h('div', { className: 'roster__cards' }, cards),
    report,
    h('p', { className: 'roster__disclaimer', text: DISCLAIMER }),
  ]);
  return { element, unmount: () => undefined };
};
