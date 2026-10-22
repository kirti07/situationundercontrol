import { RULES, TILE } from '../../src/content/tuning.ts';
import { burnBox } from '../../src/core/burn.ts';
import { cellBox, overlaps } from '../../src/core/geometry.ts';
import { type Cell, type Level, Tile } from '../../src/core/level.ts';
import { touchesTile } from '../../src/core/physics.ts';
import { PLAYER_SIZE, updatePlayer } from '../../src/core/player.ts';
import { createRun, type PlayerState } from '../../src/core/state.ts';

export interface Reach {
  readonly collectibles: readonly boolean[];
  readonly extras: readonly boolean[];
  readonly exit: boolean;
}

const MAX_TICKS = 240;
const MOVES = [-1, 0, 1] as const;
const JUMP_TICKS = [0, 6, 12, MAX_TICKS] as const;
const HAZARDS = [Tile.fire, Tile.river, Tile.pothole, Tile.smog] as const;

interface Action {
  readonly move: -1 | 0 | 1;
  readonly jumpTicks: number;
}

const boxOf = (player: PlayerState) => ({ x: player.x, y: player.y, ...PLAYER_SIZE });

const hurts = (level: Level, player: PlayerState): boolean =>
  player.y > level.rows * TILE ||
  HAZARDS.some((tile) => touchesTile(level, player, PLAYER_SIZE, tile)) ||
  level.burns.some((run) => run.always && overlaps(boxOf(player), burnBox(run))) ||
  level.jails.some((cell) => overlaps(boxOf(player), cellBox(cell, RULES.pickupInset)));

const keyOf = (player: PlayerState): string =>
  `${String(Math.floor((player.x + PLAYER_SIZE.w / 2) / TILE))}:${String(Math.floor((player.y + PLAYER_SIZE.h) / TILE))}`;

const targetsOf = (level: Level): Cell[] => [...level.collectibles, ...level.refills];

const touch = (level: Level, player: PlayerState, found: boolean[]): boolean => {
  targetsOf(level).forEach((cell, index) => {
    if (overlaps(boxOf(player), cellBox(cell, RULES.pickupInset))) found[index] = true;
  });
  return overlaps(boxOf(player), cellBox(level.exit));
};

const simulate = (level: Level, from: PlayerState, action: Action, found: boolean[]) => {
  const player = { ...from, jumpHeld: false };
  const startKey = keyOf(from);
  let exit = false;
  for (let tick = 0; tick < MAX_TICKS; tick += 1) {
    updatePlayer(level, player, { move: action.move, jump: tick < action.jumpTicks });
    if (hurts(level, player)) return { player: undefined, exit };
    exit = touch(level, player, found) || exit;
    const jumped = action.jumpTicks > 0;
    const settled = player.grounded && (jumped ? tick > 2 : keyOf(player) !== startKey);
    if (settled) return { player, exit };
  }
  return { player: undefined, exit };
};

const ACTIONS: readonly Action[] = MOVES.flatMap((move) =>
  JUMP_TICKS.map((jumpTicks) => ({ move, jumpTicks })),
);

export const explore = (level: Level): Reach => {
  const found = targetsOf(level).map(() => false);
  const start = createRun(level).player;
  const seen = new Map<string, PlayerState>([[keyOf(start), start]]);
  const queue = [start];
  let exit = false;
  const visit = (node: PlayerState): void => {
    for (const action of ACTIONS) {
      const result = simulate(level, node, action, found);
      exit = exit || result.exit;
      const next = result.player;
      if (next === undefined || seen.has(keyOf(next))) continue;
      seen.set(keyOf(next), next);
      queue.push(next);
    }
  };
  for (let node = queue.shift(); node !== undefined; node = queue.shift()) visit(node);
  const count = level.collectibles.length;
  return { collectibles: found.slice(0, count), extras: found.slice(count), exit };
};
