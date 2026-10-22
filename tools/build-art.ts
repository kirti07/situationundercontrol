import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp, { type Sharp } from 'sharp';

const SOURCE = 'design';
const OUT = 'apps/game/src/assets/art';
const WEBP = { quality: 82, effort: 6 } as const;

interface Picture {
  readonly source: string;
  readonly name: string;
  readonly width: number;
  readonly trim?: boolean;
  readonly inset?: number;
}

const PICTURES: readonly Picture[] = [
  { source: 'exports/art/india-gate-ink.png', name: 'gate-ink', width: 900 },
  {
    source: 'exports/art/india-gate-night-tricolour.png',
    name: 'gate-tricolour',
    width: 900,
    inset: 36,
  },
  { source: 'exports/art/caricature-prime-time.png', name: 'prime-time', width: 420 },
  { source: 'exports/art/caricature-public-servant.png', name: 'public-servant', width: 420 },
  { source: 'sprites/police-walk.png', name: 'police-walk', width: 240, trim: true },
  { source: 'sprites/police-asleep.png', name: 'police-asleep', width: 240, trim: true },
  { source: 'sprites/roach-hero.png', name: 'roach-hero', width: 240, trim: true },
];

const trimmed = (source: string): Sharp => sharp(join(SOURCE, source)).trim({ threshold: 8 });

const inset = async (buffer: Buffer, margin: number): Promise<Buffer> => {
  const image = sharp(buffer);
  const { width, height } = await image.metadata();
  return image.extract({ left: margin, top: 0, width: width - margin * 2, height }).toBuffer();
};

const writePicture = async (picture: Picture): Promise<void> => {
  const source =
    picture.trim === true ? trimmed(picture.source) : sharp(join(SOURCE, picture.source));
  const buffer = await inset(await source.toBuffer(), picture.inset ?? 0);
  await sharp(buffer)
    .resize({ width: picture.width, withoutEnlargement: true })
    .webp(WEBP)
    .toFile(join(OUT, `${picture.name}.webp`));
};

mkdirSync(OUT, { recursive: true });
await Promise.all(PICTURES.map(writePicture));
console.log(`Art written to ${OUT}`);
