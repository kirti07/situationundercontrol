import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp, { type Sharp } from 'sharp';

const SOURCE = 'design';
const OUT = 'apps/game/src/assets/art';
const SPRITE_HEIGHT = 96;
const SPRITE_GAP = 2;
const WEBP = { quality: 82, effort: 6 } as const;

interface Picture {
  readonly source: string;
  readonly name: string;
  readonly width: number;
  readonly trim?: boolean;
  readonly inset?: number;
}

const PICTURES: readonly Picture[] = [
  { source: 'exports/art/kartavya-path-night-map.png', name: 'map-night', width: 900 },
  { source: 'exports/art/india-gate-ink.png', name: 'gate-ink', width: 900 },
  {
    source: 'exports/art/india-gate-night-tricolour.png',
    name: 'gate-tricolour',
    width: 900,
    inset: 36,
  },
  { source: 'exports/art/caricature-prime-time.png', name: 'prime-time', width: 420 },
  { source: 'exports/art/caricature-chanakya.png', name: 'chanakya', width: 420 },
  { source: 'exports/art/caricature-pradhan-sevak.png', name: 'pradhan-sevak', width: 420 },
  { source: 'sprites/G5VIYt.png', name: 'officer', width: 240, trim: true },
  { source: 'sprites/hwcSq.png', name: 'roach-hero', width: 240, trim: true },
];

const ROACH_FRAMES: readonly string[] = [
  'sprites/hwcSq.png',
  'sprites/A6JGhF.png',
  'sprites/HYaMf.png',
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

interface Frame {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

const spriteBuffers = (): Promise<{ data: Buffer; width: number }[]> =>
  Promise.all(
    ROACH_FRAMES.map(async (source) => {
      const { data, info } = await sharp(await trimmed(source).toBuffer())
        .resize({ height: SPRITE_HEIGHT })
        .png()
        .toBuffer({ resolveWithObject: true });
      return { data, width: info.width };
    }),
  );

const writeAtlas = async (): Promise<void> => {
  const sprites = await spriteBuffers();
  const frames: Frame[] = [];
  let x = 0;
  for (const sprite of sprites) {
    frames.push({ x, y: 0, w: sprite.width, h: SPRITE_HEIGHT });
    x += sprite.width + SPRITE_GAP;
  }
  await sharp({
    create: {
      width: x,
      height: SPRITE_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(
      sprites.map((sprite, i) => ({ input: sprite.data, left: frames[i]?.x ?? 0, top: 0 })),
    )
    .webp({ ...WEBP, alphaQuality: 90 })
    .toFile(join(OUT, 'roach-atlas.webp'));
  writeFileSync(join(OUT, 'roach-atlas.json'), `${JSON.stringify({ frames }, null, 2)}\n`);
};

mkdirSync(OUT, { recursive: true });
await Promise.all([...PICTURES.map(writePicture), writeAtlas()]);
console.log(`Art written to ${OUT}`);
