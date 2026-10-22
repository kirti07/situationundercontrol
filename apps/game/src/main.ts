import './styles/index.css';
import policeWalk from './assets/art/police-walk.webp';
import primeTime from './assets/art/prime-time.webp';
import publicServant from './assets/art/public-servant.webp';
import roachHero from './assets/art/roach-hero.webp';

const CAST = [
  { src: roachHero, name: 'The Cockroach' },
  { src: primeTime, name: 'Media' },
  { src: publicServant, name: 'Public Servant' },
  { src: policeWalk, name: 'Police' },
] as const;

const element = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text = '',
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
};

const portrait = ({ src, name }: (typeof CAST)[number]): HTMLElement => {
  const figure = element('figure', 'cast__member');
  const image = element('img', 'cast__image');
  image.src = src;
  image.alt = name;
  figure.append(image, element('figcaption', 'cast__name', name));
  return figure;
};

const cast = element('div', 'cast');
cast.append(...CAST.map(portrait));

document
  .getElementById('app')
  ?.replaceChildren(
    element('h1', 'title', 'Situation Under Control'),
    element('p', 'tagline', 'New game in the works'),
    cast,
  );
