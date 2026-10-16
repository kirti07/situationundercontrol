import { h } from '../dom.ts';
import { editionDateline, editionNumber } from '../content/format.ts';

export const dateline = (
  left: string,
  middle: string,
  right: string,
  accent = false,
): HTMLElement =>
  h('div', { className: 'dateline' }, [
    h('span', { text: left }),
    h('span', { text: middle }),
    h('span', { className: accent ? 'dateline__accent' : '', text: right }),
  ]);

export const editionDateLine = (edition: number): HTMLElement =>
  dateline(editionNumber(edition), editionDateline(edition), '₹2');

type MastheadSize = 'large' | 'small';

const subtitle = (): HTMLElement =>
  h('p', { className: 'masthead__sub' }, [
    h('span', {
      className: 'masthead__hindi',
      attrs: { lang: 'hi' },
      text: 'स्थिति नियंत्रण में है',
    }),
    h('span', { text: ' · The Evening Edition' }),
  ]);

const EXTRAS: Readonly<Record<MastheadSize, () => readonly Node[]>> = {
  large: () => [subtitle()],
  small: () => [],
};

export const masthead = (size: MastheadSize): HTMLElement =>
  h('header', { className: `masthead masthead--${size}` }, [
    h('h1', { className: 'masthead__title', text: 'Situation Under Control' }),
    ...EXTRAS[size](),
  ]);
