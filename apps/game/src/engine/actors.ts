import { CAUGHT_LABEL } from '../content/copy.ts';
import type { Look } from '../content/roles.ts';
import { FX, PATROL, PLAYER } from '../content/tuning.ts';
import { isAwake, isTired } from '../core/patrol.ts';
import type { PatrolState, RunState } from '../core/state.ts';
import { COLOR, STAMP_FONT } from './palette.ts';
import { isReady, type Sprites } from './sprites.ts';

const PX = 16;
const PLAYER_HEIGHT: Readonly<Record<Look, number>> = {
  roach: 20,
  media: 23,
  servant: 23,
  police: 25,
};
const POLICE_HEIGHT = 25;
const ASLEEP_HEIGHT = 20;
const ENERGY_WIDTH = 14;

const drawSprite = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centre: number,
  feet: number,
  height: number,
  flip: boolean,
): void => {
  if (!isReady(image)) return;
  const width = (height * image.naturalWidth) / image.naturalHeight;
  ctx.save();
  ctx.translate(Math.round(centre), Math.round(feet));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(image, -width / 2, -height, width, height);
  ctx.restore();
};

const drawEnergy = (
  ctx: CanvasRenderingContext2D,
  patrol: PatrolState,
  centre: number,
  top: number,
): void => {
  const x = Math.round(centre - ENERGY_WIDTH / 2);
  ctx.fillStyle = COLOR.night;
  ctx.fillRect(x - 1, top - 1, ENERGY_WIDTH + 2, 4);
  if (!isAwake(patrol)) {
    ctx.fillStyle = COLOR.steel;
    ctx.font = STAMP_FONT;
    ctx.fillText('Zz', x + 2, top - 3);
    return;
  }
  const share = patrol.energy / PATROL.energyMax;
  ctx.fillStyle = isTired(patrol) ? COLOR.red : COLOR.sodium;
  ctx.fillRect(x, top, Math.max(1, Math.round(share * ENERGY_WIDTH)), 2);
};

const drawPatrol = (
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  patrol: PatrolState,
  camera: number,
): void => {
  const centre = (patrol.x + PATROL.width / 2) / FX - camera * PX;
  const feet = (patrol.y + PATROL.height) / FX;
  const awake = isAwake(patrol);
  const image = awake ? sprites.policeWalk : sprites.policeAsleep;
  const height = awake ? POLICE_HEIGHT : ASLEEP_HEIGHT;
  drawSprite(ctx, image, centre, feet, height, awake && patrol.dir < 0);
  drawEnergy(ctx, patrol, centre, feet - height - 4);
};

const drawStamp = (
  ctx: CanvasRenderingContext2D,
  label: string,
  centre: number,
  top: number,
): void => {
  ctx.save();
  ctx.translate(Math.round(centre), Math.round(top));
  ctx.rotate(-0.2);
  ctx.font = STAMP_FONT;
  ctx.textAlign = 'center';
  ctx.strokeStyle = COLOR.red;
  const width = Math.ceil(ctx.measureText(label).width) + 10;
  ctx.strokeRect(-width / 2, -10, width, 14);
  ctx.fillStyle = COLOR.red;
  ctx.fillText(label, 0, 1);
  ctx.restore();
};

const drawSnore = (ctx: CanvasRenderingContext2D, centre: number, top: number): void => {
  ctx.fillStyle = COLOR.steel;
  ctx.font = STAMP_FONT;
  ctx.fillText('Zz', Math.round(centre), Math.round(top));
};

interface Pose {
  readonly image: HTMLImageElement;
  readonly height: number;
  readonly flip: boolean;
}

const poseOf = (sprites: Sprites, state: RunState, look: Look): Pose =>
  state.dozing > 0
    ? { image: sprites.policeAsleep, height: ASLEEP_HEIGHT, flip: false }
    : { image: sprites.player, height: PLAYER_HEIGHT[look], flip: state.player.facing < 0 };

const drawPlayer = (
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  state: RunState,
  camera: number,
  look: Look,
): void => {
  const { player } = state;
  const centre = (player.x + PLAYER.width / 2) / FX - camera * PX;
  const feet = (player.y + PLAYER.height) / FX;
  const caught = state.phase === 'caught';
  const dozing = state.dozing > 0;
  const { image, height, flip } = poseOf(sprites, state, look);
  if (!caught || (state.phaseTicks >> 2) % 2 === 0) {
    drawSprite(ctx, image, centre, feet, height, flip);
  }
  if (dozing) drawSnore(ctx, centre, feet - height - 2);
  if (caught && state.cause !== undefined) {
    drawStamp(ctx, CAUGHT_LABEL[state.cause], centre, feet - height - 6);
  }
};

export const drawActors = (
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  state: RunState,
  camera: number,
  look: Look,
): void => {
  state.patrols.forEach((patrol) => {
    drawPatrol(ctx, sprites, patrol, camera);
  });
  drawPlayer(ctx, sprites, state, camera, look);
};
