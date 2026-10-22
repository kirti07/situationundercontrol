import gateArt from '../assets/art/gate-tricolour.webp';
import { button, el, image } from '../dom.ts';
import { currentEdition } from '../net/edition.ts';
import type { ScreenFactory } from '../router.ts';
import { load } from '../storage.ts';
import { liveStrip } from './live-strip.ts';

const DISCLAIMER = 'A work of satire. All characters are fictional.';

const sideButton = (
  modifier: string,
  title: string,
  line: string,
  onClick: () => void,
): HTMLButtonElement => {
  const node = button(`side side--${modifier}`, '', onClick);
  node.append(el('span', 'side__title', title), el('span', 'side__line', line));
  return node;
};

export const homeScreen: ScreenFactory<'home'> = (navigate) => {
  const root = el('section', 'home');
  const copy = el('div', 'home__copy');
  const best = Math.max(load().best.cockroach, load().best.agency);
  const live = liveStrip();
  copy.append(
    el('p', 'home__dateline', `NEW DELHI · EDITION NO. ${String(currentEdition().edition)}`),
    el('h1', 'home__title', 'Situation Under Control'),
    el('p', 'home__hindi', 'स्थिति नियंत्रण में है'),
    el(
      'p',
      'home__pitch',
      'The cockroaches march for the flags past potholes, smog and toxic foam. The Agency rounds them up and dodges the real issues. Same Delhi, two sides of the barricade.',
    ),
    live.node,
    sideButton('roach', 'Be the Cockroaches', 'Collect the flags. Dodge the city.', () => {
      navigate('play', { side: 'cockroach' });
    }),
    sideButton(
      'agency',
      'Join the Agency',
      'Detain, distract, collect. Dodge the real issues.',
      () => {
        navigate('select');
      },
    ),
    el(
      'p',
      'home__meta',
      best > 0 ? `Best: ${best.toLocaleString('en-IN')}` : 'Arrow keys or thumbs. Two buttons.',
    ),
    el('p', 'home__disclaimer', DISCLAIMER),
  );
  root.append(copy, image('home__art', gateArt, 'India Gate at night, lit in the tricolour'));
  return { root, dispose: live.stop };
};
