import { describe, expect, it } from 'vitest';
import { BUNDLED, isEdition } from '../src/content/edition.ts';
import { CHARACTERS, type Role } from '../src/content/roles.ts';
import { BURN, ENERGY, FLOATY_MAX_FALL, PLAYER } from '../src/content/tuning.ts';
import { heatOf } from '../src/core/burn.ts';
import { speedsOf } from '../src/core/energy.ts';
import { parseLevel } from '../src/core/level.ts';
import type { Input } from '../src/core/player.ts';
import { createRun, type RunState } from '../src/core/state.ts';
import { step } from '../src/core/step.ts';
import { play, RIGHT } from './support/levels.ts';

const sky = (width: number, rows: number): string[] =>
  Array.from({ length: rows }, () => ' '.repeat(width));

const agencyRun = (rows: readonly string[], role: Role = CHARACTERS.media): RunState =>
  createRun(
    parseLevel({ id: 'test', name: 'TEST', maps: { cockroach: rows, agency: rows } }, 'agency'),
    undefined,
    1,
    role.mods,
  );

const STILL: Input = { move: 0, jump: false };

describe('burning issues', () => {
  it('scorches you on an always-burning platform', () => {
    const state = agencyRun([
      ...sky(12, 7),
      '  ^^^^      ',
      '  S         ',
      ' $         G',
      '############',
    ]);
    state.player.y -= 2 * 16 * 16;
    const events = play(state, STILL, 30);
    expect(events).toContainEqual({ kind: 'caught', cause: 'fire' });
  });

  it('a timed platform smokes for a second, then burns, then cools', () => {
    const [run] = parseLevel(
      { id: 't', name: 'T', maps: { cockroach: ['S$G', 'TT#'], agency: ['S$G', 'TT#'] } },
      'agency',
    ).burns;
    if (run === undefined) throw new Error('no timed run');
    const heats = Array.from({ length: BURN.cycleTicks }, (_, tick) => heatOf(run, tick));
    expect(heats.filter((heat) => heat === 'fire')).toHaveLength(BURN.burnTicks);
    expect(heats.filter((heat) => heat === 'smoke')).toHaveLength(BURN.smokeTicks);
  });

  it('only catches you on a timed platform while it burns', () => {
    const state = agencyRun([...sky(12, 8), ' S$       G ', ' TTTT       ', '############']);
    const events = play(state, STILL, BURN.cycleTicks);
    const caughtAt = state.tick;
    expect(events).toContainEqual({ kind: 'caught', cause: 'fire' });
    expect(
      heatOf(
        state.level.burns[0] ?? { col: 0, row: 0, length: 1, always: true, offset: 0 },
        caughtAt,
      ),
    ).toBe('fire');
  });
});

describe('falling', () => {
  it('costs a life when you drop off the bottom', () => {
    const state = agencyRun([...sky(12, 9), 'S $      G  ', '###    #####']);
    expect(play(state, RIGHT, 90)).toContainEqual({ kind: 'caught', cause: 'fall' });
  });
});

describe('what each Agency character collects', () => {
  it('Police rounds up cockroaches and Media runs trivial stories', () => {
    expect(CHARACTERS.police.item).toBe('roach');
    expect(CHARACTERS.media.item).toBe('story');
    expect(CHARACTERS.publicServant.item).toBe('money');
  });

  it('the edition has a trivial story for every pickup in a level', () => {
    expect(BUNDLED.stories.length).toBeGreaterThanOrEqual(9);
  });
});

describe('police energy', () => {
  const ROWS = [...sky(40, 9), 'S $' + ' '.repeat(36) + 'G', '#'.repeat(40)];

  it('drains while he moves and slows him when he is tired', () => {
    const state = agencyRun(ROWS, CHARACTERS.police);
    state.energy = ENERGY.tiredBelow + 2;
    play(state, RIGHT, 4);
    expect(state.energy).toBeLessThan(ENERGY.tiredBelow);
    expect(speedsOf(state).run).toBe(ENERGY.tiredRunSpeed);
  });

  it('dozes off at zero, ignores input for 2 seconds, then wakes', () => {
    const state = agencyRun(ROWS, CHARACTERS.police);
    state.energy = 1;
    expect(step(state, RIGHT)).toContainEqual({ kind: 'dozed' });
    const x = state.player.x;
    play(state, RIGHT, ENERGY.dozeTicks - 1);
    expect(state.player.x).toBe(x);
    play(state, RIGHT, 1);
    expect(state.energy).toBe(ENERGY.wakeEnergy);
  });

  it('chai and samosas top him up', () => {
    const state = agencyRun([...sky(12, 9), 'S C $    G  ', '############'], CHARACTERS.police);
    state.energy = 100;
    expect(play(state, RIGHT, 40)).toContainEqual({ kind: 'refill' });
    expect(state.energy).toBeGreaterThan(ENERGY.refill);
  });

  it('never tires the other characters', () => {
    const state = agencyRun(ROWS, CHARACTERS.media);
    play(state, RIGHT, 200);
    expect(speedsOf(state).run).toBe(PLAYER.runSpeed);
  });
});

describe('the Public Servant', () => {
  it('falls slower, a floatier jump', () => {
    const state = agencyRun(
      [...sky(12, 9), 'S $      G  ', '############'],
      CHARACTERS.publicServant,
    );
    expect(speedsOf(state).maxFall).toBe(FLOATY_MAX_FALL);
  });
});

describe('edition content', () => {
  it('the bundled edition passes its own limits', () => {
    expect(isEdition(BUNDLED)).toBe(true);
  });

  it('rejects a burning-issue label that will not fit its platform', () => {
    expect(isEdition({ ...BUNDLED, burningIssues: ['UNEMPLOYMENT IN EVERY CITY'] })).toBe(false);
  });
});
