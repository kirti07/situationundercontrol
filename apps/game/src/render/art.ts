import atlas from '../assets/art/roach-atlas.json';
import atlasUrl from '../assets/art/roach-atlas.webp';
import mapUrl from '../assets/art/map-night.webp';
import { FONT_FACES } from './palette.ts';

export interface Frame {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface Art {
  readonly map: HTMLImageElement;
  readonly roaches: HTMLImageElement;
  readonly frames: readonly Frame[];
}

export const MAP_FRAME = { x: -7.5, y: 112, w: 375, h: 500 } as const;

const loadImage = async (src: string): Promise<HTMLImageElement> => {
  const image = new Image();
  image.decoding = 'async';
  image.src = src;
  await image.decode();
  return image;
};

const loadFonts = (): Promise<unknown> =>
  Promise.allSettled(FONT_FACES.map((face) => document.fonts.load(face)));

export const loadArt = async (): Promise<Art> => {
  const [map, roaches] = await Promise.all([loadImage(mapUrl), loadImage(atlasUrl), loadFonts()]);
  return { map, roaches, frames: atlas.frames };
};
