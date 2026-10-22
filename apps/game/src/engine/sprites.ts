import hazardFire from '../assets/art/hazard-fire.webp';
import hazardPothole from '../assets/art/hazard-pothole.webp';
import hazardRiver from '../assets/art/hazard-river.webp';
import hazardSmog from '../assets/art/hazard-smog.webp';
import mediaRun from '../assets/art/media-run.webp';
import policeAsleep from '../assets/art/police-asleep.webp';
import policeWalk from '../assets/art/police-walk.webp';
import roachCrowd from '../assets/art/roach-crowd.webp';
import roachHero from '../assets/art/roach-hero.webp';
import servantRun from '../assets/art/servant-run.webp';
import type { Look } from '../content/roles.ts';

export type HazardName = 'fire' | 'river' | 'pothole' | 'smog';
export type ArtName = HazardName | 'crowd';

const LOOKS: Readonly<Record<Look, string>> = {
  roach: roachHero,
  media: mediaRun,
  servant: servantRun,
  police: policeWalk,
};

const ART: Readonly<Record<ArtName, string>> = {
  crowd: roachCrowd,
  fire: hazardFire,
  river: hazardRiver,
  pothole: hazardPothole,
  smog: hazardSmog,
};

export const lookImage = (look: Look): string => LOOKS[look];

export interface Sprites {
  readonly player: HTMLImageElement;
  readonly policeWalk: HTMLImageElement;
  readonly policeAsleep: HTMLImageElement;
  readonly art: (name: ArtName) => HTMLImageElement;
}

const load = (src: string): HTMLImageElement => {
  const image = new Image();
  image.decoding = 'async';
  image.src = src;
  return image;
};

export const loadSprites = (look: Look): Sprites => {
  const art = new Map<ArtName, HTMLImageElement>();
  return {
    player: load(LOOKS[look]),
    policeWalk: load(policeWalk),
    policeAsleep: load(policeAsleep),
    art: (name) => {
      const known = art.get(name);
      if (known !== undefined) return known;
      const image = load(ART[name]);
      art.set(name, image);
      return image;
    },
  };
};

export const isReady = (image: HTMLImageElement): boolean =>
  image.complete && image.naturalWidth > 0;
