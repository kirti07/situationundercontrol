import type { RunState } from './state.ts';

const PHASE_CODE = { play: 0, caught: 1, clear: 2, over: 3 } as const;

const mix = (hash: number, value: number): number => Math.imul(hash ^ (value | 0), 16777619) >>> 0;

export const hashState = (state: RunState): number => {
  const { player } = state;
  const values = [
    state.tick,
    state.score,
    state.lives,
    PHASE_CODE[state.phase],
    player.x,
    player.y,
    player.vx,
    player.vy,
    state.energy,
    state.dozing,
    ...state.collected.map(Number),
    ...state.refillsTaken.map(Number),
    ...state.patrols.flatMap((patrol) => [patrol.x, patrol.dir, patrol.energy, patrol.sleep]),
  ];
  return values.reduce(mix, 2166136261);
};
