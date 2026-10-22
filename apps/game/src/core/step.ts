import { RULES, SCORE, TICKS_PER_SECOND, TILE } from '../content/tuning.ts';
import { burnBox, heatOf } from './burn.ts';
import { refill, speedsOf, spendEnergy } from './energy.ts';
import { type Box, cellBox, overlaps } from './geometry.ts';
import { type Cell, Tile } from './level.ts';
import { isAwake, patrolBox, updatePatrol } from './patrol.ts';
import { type Body, touchesTile } from './physics.ts';
import { type Input, PLAYER_SIZE, updatePlayer } from './player.ts';
import { type Cause, type Phase, placePlayer, type RunState } from './state.ts';

export type RunEvent =
  | { readonly kind: 'jump' }
  | { readonly kind: 'collect'; readonly index: number }
  | { readonly kind: 'refill' }
  | { readonly kind: 'dozed' }
  | { readonly kind: 'exitOpen' }
  | { readonly kind: 'asleep'; readonly index: number }
  | { readonly kind: 'caught'; readonly cause: Cause }
  | { readonly kind: 'respawn' }
  | { readonly kind: 'clear'; readonly bonus: number }
  | { readonly kind: 'over' };

const playerBox = (player: Body): Box => ({
  x: player.x,
  y: player.y,
  w: PLAYER_SIZE.w,
  h: PLAYER_SIZE.h,
});

const pickUp = (
  box: Box,
  cells: readonly Cell[],
  taken: boolean[],
  onPick: (index: number) => void,
): void => {
  cells.forEach((cell, index) => {
    if (taken[index] === true || !overlaps(box, cellBox(cell, RULES.pickupInset))) return;
    taken[index] = true;
    onPick(index);
  });
};

const collect = (state: RunState, events: RunEvent[]): void => {
  const box = playerBox(state.player);
  pickUp(box, state.level.collectibles, state.collected, (index) => {
    state.score += SCORE.collect;
    events.push({ kind: 'collect', index });
  });
  pickUp(box, state.level.refills, state.refillsTaken, () => {
    refill(state);
    events.push({ kind: 'refill' });
  });
  if (state.exitOpen || state.collected.includes(false)) return;
  state.exitOpen = true;
  events.push({ kind: 'exitOpen' });
};

const HAZARDS: readonly (readonly [Tile, Cause])[] = [
  [Tile.fire, 'fire'],
  [Tile.river, 'river'],
  [Tile.pothole, 'pothole'],
  [Tile.smog, 'smog'],
];

const hazardOf = (state: RunState): Cause | undefined =>
  HAZARDS.find(([tile]) => touchesTile(state.level, state.player, PLAYER_SIZE, tile))?.[1];

const burning = (state: RunState, box: Box): boolean =>
  state.level.burns.some(
    (run) => heatOf(run, state.tick) === 'fire' && overlaps(box, burnBox(run)),
  );

const causeOfCapture = (state: RunState): Cause | undefined => {
  const box = playerBox(state.player);
  if (state.patrols.some((patrol) => isAwake(patrol) && overlaps(box, patrolBox(patrol))))
    return 'patrol';
  if (state.level.jails.some((cell) => overlaps(box, cellBox(cell, RULES.pickupInset))))
    return 'jail';
  if (burning(state, box)) return 'fire';
  const hazard = hazardOf(state);
  if (hazard !== undefined) return hazard;
  if (state.player.y > state.level.rows * TILE) return 'fall';
  return undefined;
};

const clearBonus = (state: RunState): number => {
  const seconds = Math.trunc(state.tick / TICKS_PER_SECOND);
  const time = Math.max(0, SCORE.parSeconds - seconds) * SCORE.timeBonusPerSecond;
  return SCORE.clear + time + (state.caughtThisLevel === 0 ? SCORE.neverCaught : 0);
};

const enter = (state: RunState, phase: Phase, ticks = 0): void => {
  state.phase = phase;
  state.phaseTicks = ticks;
};

const capture = (state: RunState, cause: Cause, events: RunEvent[]): void => {
  state.lives -= 1;
  state.caughtThisLevel += 1;
  state.cause = cause;
  enter(state, 'caught', RULES.caughtTicks);
  events.push({ kind: 'caught', cause });
};

const reachExit = (state: RunState, events: RunEvent[]): void => {
  const bonus = clearBonus(state);
  state.score += bonus;
  enter(state, 'clear');
  events.push({ kind: 'clear', bonus });
};

const movePlayer = (state: RunState, input: Input, events: RunEvent[]): void => {
  const spent = spendEnergy(state, input);
  if (spent.dozed) events.push({ kind: 'dozed' });
  if (updatePlayer(state.level, state.player, spent.input, speedsOf(state))) {
    events.push({ kind: 'jump' });
  }
};

const stepPlay = (state: RunState, input: Input, events: RunEvent[]): void => {
  movePlayer(state, input, events);
  state.patrols.forEach((patrol, index) => {
    if (updatePatrol(state.level, patrol)) events.push({ kind: 'asleep', index });
  });
  collect(state, events);
  const cause = causeOfCapture(state);
  if (cause !== undefined) {
    capture(state, cause, events);
    return;
  }
  if (state.exitOpen && overlaps(playerBox(state.player), cellBox(state.level.exit))) {
    reachExit(state, events);
  }
};

const stepCaught = (state: RunState, _input: Input, events: RunEvent[]): void => {
  state.phaseTicks -= 1;
  if (state.phaseTicks > 0) return;
  if (state.lives <= 0) {
    enter(state, 'over');
    events.push({ kind: 'over' });
    return;
  }
  placePlayer(state.player, state.level.start);
  state.dozing = 0;
  enter(state, 'play');
  events.push({ kind: 'respawn' });
};

const idle = (): void => undefined;

const PHASES: Readonly<Record<Phase, (state: RunState, input: Input, events: RunEvent[]) => void>> =
  {
    play: stepPlay,
    caught: stepCaught,
    clear: idle,
    over: idle,
  };

export const step = (state: RunState, input: Input): RunEvent[] => {
  const events: RunEvent[] = [];
  if (state.phase === 'play') state.tick += 1;
  PHASES[state.phase](state, input, events);
  return events;
};
