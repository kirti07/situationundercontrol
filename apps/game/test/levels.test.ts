import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/content/levels.ts';
import { CHARACTERS, COCKROACH, type Side } from '../src/content/roles.ts';
import { hashState } from '../src/core/hash.ts';
import { parseLevel } from '../src/core/level.ts';
import type { Input } from '../src/core/player.ts';
import { createRun } from '../src/core/state.ts';
import { step } from '../src/core/step.ts';
import { explore } from './support/reach.ts';

const maps = LEVELS.flatMap((def) =>
  (Object.keys(def.maps) as Side[]).map((side) => ({ def, side, level: parseLevel(def, side) })),
);

describe.each(maps)('$def.id ($side)', ({ level }) => {
  it('every collectible can be reached with the real jump', () => {
    expect(explore(level).collectibles).not.toContain(false);
  });

  it('the exit can be reached', () => {
    expect(explore(level).exit).toBe(true);
  });

  it('every fake-news headline and refill can be reached', () => {
    expect(explore(level).extras).not.toContain(false);
  });
});

const SOLID = new Set(['#']);
const STANDABLE = new Set(['=', '^', 'T']);

describe.each(LEVELS)('$id geometry', (def) => {
  it('is the same on both sides', () => {
    const cockroach = def.maps.cockroach.join('\n');
    const agency = def.maps.agency.join('\n');
    expect(agency.length).toBe(cockroach.length);
    const differences = Array.from(cockroach).filter((char, index) => {
      const other = agency.charAt(index);
      if (SOLID.has(char) || SOLID.has(other)) return char !== other;
      return STANDABLE.has(char) !== STANDABLE.has(other);
    });
    expect(differences).toEqual([]);
  });
});

describe('reachability check', () => {
  it('reports a flag that is too high to reach', () => {
    const rows = [
      '     F    ',
      ...Array.from({ length: 4 }, () => '          '),
      'S       G ',
      '##########',
    ];
    const level = parseLevel(
      { id: 'high', name: 'HIGH', maps: { cockroach: rows, agency: rows } },
      'cockroach',
    );
    expect(explore(level).collectibles).toEqual([false]);
  });
});

const scripted = (tick: number): Input => ({ move: 1, jump: tick % 50 < 20 });

describe('golden replay', () => {
  it.each([
    ['cockroach', COCKROACH],
    ['agency as Police', CHARACTERS.police],
  ] as const)('level 1 (%s) with a fixed input script ends in the same state', (_, role) => {
    const [first] = LEVELS;
    if (first === undefined) throw new Error('no levels');
    const state = createRun(parseLevel(first, role.side), undefined, 7, role.mods);
    for (let tick = 0; tick < 1500; tick += 1) step(state, scripted(tick));
    expect(hashState(state)).toMatchSnapshot();
  });
});
