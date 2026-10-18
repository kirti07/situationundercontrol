import { createRun, editionSeed, isOver, scoreOf, step } from '../src/index.ts';
import type { BotSpec } from './bots.ts';

export interface Spread {
  readonly p25: number;
  readonly median: number;
  readonly p75: number;
}

export const editionSeeds = (count: number): readonly number[] =>
  Array.from({ length: count }, (_, i) => editionSeed(i + 1));

export const playBot = (bot: BotSpec, seed: number): number => {
  const state = createRun({ seed, side: bot.side, character: bot.character });
  while (!isOver(state)) step(state, bot.play(state));
  return scoreOf(state);
};

const at = (sorted: readonly number[], fraction: number): number =>
  sorted[Math.floor((sorted.length - 1) * fraction)] ?? 0;

export const spreadOf = (scores: readonly number[]): Spread => {
  const sorted = scores.toSorted((a, b) => a - b);
  return { p25: at(sorted, 0.25), median: at(sorted, 0.5), p75: at(sorted, 0.75) };
};

export const playSeeds = (bot: BotSpec, seeds: readonly number[]): Spread =>
  spreadOf(seeds.map((seed) => playBot(bot, seed)));
