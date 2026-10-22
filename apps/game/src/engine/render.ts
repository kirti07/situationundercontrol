import type { Edition } from '../content/edition.ts';
import type { Role } from '../content/roles.ts';
import { FX, PLAYER, TILE, VIEW } from '../content/tuning.ts';
import type { Cell } from '../core/level.ts';
import type { RunState } from '../core/state.ts';
import { drawActors } from './actors.ts';
import { followCamera, snapCamera } from './camera.ts';
import { drawHazards, drawLedges } from './hazards.ts';
import { COLOR, STAMP_FONT } from './palette.ts';
import { drawProtest } from './protest.ts';
import { drawProps, drawSky, drawTiles } from './scene.ts';
import type { Sprites } from './sprites.ts';

const WIDTH = VIEW.cols * (TILE / FX);
const HEIGHT = VIEW.rows * (TILE / FX);
const PX = 16;
const BURST_FRAMES = 40;
const BURST_HOLD = 26;
const BURST_POINTS = 10;

export interface Renderer {
  readonly resize: (width: number, height: number) => void;
  readonly snap: (state: RunState) => void;
  readonly burst: (cell: Cell, text: string) => void;
  readonly protest: () => void;
  readonly draw: (state: RunState) => void;
}

interface Burst {
  readonly cell: Cell;
  readonly text: string;
  readonly born: number;
}

const centreCol = (state: RunState): number =>
  Math.floor((state.player.x + PLAYER.width / 2) / TILE);

const drawBurst = (
  ctx: CanvasRenderingContext2D,
  burst: Burst,
  camera: number,
  age: number,
): void => {
  const x = (burst.cell.col - camera) * PX + 8;
  const y = burst.cell.row * PX - 12 - age / 8;
  const radius = 8 + Math.min(age, 4);
  ctx.save();
  ctx.globalAlpha = age < BURST_HOLD ? 1 : 1 - (age - BURST_HOLD) / (BURST_FRAMES - BURST_HOLD);
  ctx.beginPath();
  for (let point = 0; point < BURST_POINTS * 2; point += 1) {
    const angle = (point * Math.PI) / BURST_POINTS;
    const reach = point % 2 === 0 ? radius : radius * 0.55;
    ctx.lineTo(x + Math.cos(angle) * reach * 2.2, y + Math.sin(angle) * reach);
  }
  ctx.closePath();
  ctx.fillStyle = COLOR.burst;
  ctx.fill();
  ctx.strokeStyle = COLOR.ink;
  ctx.stroke();
  ctx.font = STAMP_FONT;
  ctx.textAlign = 'center';
  ctx.fillStyle = COLOR.ink;
  ctx.fillText(burst.text, x, y + 4);
  ctx.restore();
};

export const createRenderer = (
  canvas: HTMLCanvasElement,
  sprites: Sprites,
  role: Role,
  edition: Edition,
): Renderer => {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (ctx === null) throw new Error('Canvas 2D is not available');
  let camera = 0;
  let frame = 0;
  let protestFrom = -1;
  let bursts: Burst[] = [];
  return {
    resize: (width, height) => {
      const scale = Math.max(1, Math.floor(Math.min(width / WIDTH, height / HEIGHT)));
      const ratio = window.devicePixelRatio;
      canvas.width = Math.round(WIDTH * scale * ratio);
      canvas.height = Math.round(HEIGHT * scale * ratio);
      canvas.style.width = `${String(WIDTH * scale)}px`;
      canvas.style.height = `${String(HEIGHT * scale)}px`;
    },
    snap: (state) => {
      camera = snapCamera(state.level, centreCol(state));
      protestFrom = -1;
      bursts = [];
    },
    burst: (cell, text) => {
      bursts.push({ cell, text, born: frame });
    },
    protest: () => {
      protestFrom = frame;
    },
    draw: (state) => {
      frame += 1;
      camera = followCamera(state.level, camera, centreCol(state));
      const pixel = canvas.width / WIDTH;
      ctx.setTransform(pixel, 0, 0, pixel, 0, 0);
      ctx.imageSmoothingQuality = 'high';
      ctx.lineWidth = 1;
      drawSky(ctx, camera);
      drawTiles(ctx, state.level, camera, state.tick);
      drawLedges(ctx, sprites, state, camera, edition.burningIssues);
      drawProps(ctx, sprites, state, camera, role);
      drawActors(ctx, sprites, state, camera, role.look);
      if (protestFrom >= 0) {
        drawProtest(ctx, sprites, state.level, camera, frame - protestFrom, edition.placards);
      }
      drawHazards(ctx, sprites, state, camera, edition.hazardTags);
      bursts = bursts.filter((burst) => frame - burst.born < BURST_FRAMES);
      bursts.forEach((burst) => {
        drawBurst(ctx, burst, camera, frame - burst.born);
      });
    },
  };
};
