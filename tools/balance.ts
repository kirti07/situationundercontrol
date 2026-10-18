import { BOTS, type BotName } from '../packages/sim/balance/bots.ts';
import { editionSeeds, playSeeds, type Spread } from '../packages/sim/balance/run.ts';
import { CLOCK_START_MINUTE, REACHED_QUOTA, Side } from '../packages/sim/src/index.ts';

const EDITIONS = Number(process.argv[2] ?? 20);

const clock = (minutes: number): string => {
  const total = CLOCK_START_MINUTE + minutes;
  const hour = Math.floor(total / 60) % 12 || 12;
  return `${String(hour)}:${String(total % 60).padStart(2, '0')} PM`;
};

const quota = (reached: number): string =>
  `${String(reached)} (${String(Math.round((reached * 100) / REACHED_QUOTA))}%)`;

const FORMAT: Readonly<Record<Side, (score: number) => string>> = {
  [Side.Agency]: clock,
  [Side.Cockroach]: quota,
};

const row = (name: BotName, spread: Spread): Record<string, string> => {
  const format = FORMAT[BOTS[name].side];
  return {
    bot: name,
    p25: format(spread.p25),
    median: format(spread.median),
    p75: format(spread.p75),
  };
};

const seeds = editionSeeds(EDITIONS);
const started = performance.now();
const names = Object.keys(BOTS) as BotName[];
const rows = names.map((name) => row(name, playSeeds(BOTS[name], seeds)));
console.table(rows);
console.log(
  `${String(EDITIONS)} editions per bot · ${String(Math.round(performance.now() - started))} ms`,
);
