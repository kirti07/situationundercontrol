import { Character, Side } from '@suc/sim';
import { h } from '../dom.ts';
import type { ScreenFactory } from '../router.ts';

export const frontScreen: ScreenFactory<'front'> = (_params, navigate) => {
  const agency = h('button', {
    className: 'side-button side-button--agency',
    text: 'Join the Agency',
    onClick: () => {
      navigate('play', { side: Side.Agency, character: Character.Chanakya });
    },
  });
  const roaches = h('button', {
    className: 'side-button side-button--roach',
    text: 'Be the Cockroaches',
    onClick: () => {
      navigate('play', { side: Side.Cockroach, character: Character.None });
    },
  });
  const element = h('section', { className: 'front' }, [
    h('h1', { className: 'masthead', text: 'Situation Under Control' }),
    h('div', { className: 'front__sides' }, [agency, roaches]),
  ]);
  return { element, unmount: () => undefined };
};
