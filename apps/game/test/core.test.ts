import { describe, expect, it } from 'vitest';
import { FX, PATROL, PLAYER, RULES, SCORE, TICKS_PER_SECOND, TILE } from '../src/content/tuning.ts';
import { updatePatrol } from '../src/core/patrol.ts';
import { step } from '../src/core/step.ts';
import { JUMP, levelOf, play, RIGHT, runOf } from './support/levels.ts';

const sky = (width: number, rows: number): string[] =>
  Array.from({ length: rows }, () => ' '.repeat(width));

const FLAT = [...sky(12, 9), 'S  F      G ', '############'];

const peakHeight = (taps: number): number => {
  const state = runOf(FLAT);
  play(state, { move: 0, jump: false }, 2);
  const ground = state.player.y;
  let top = ground;
  for (let tick = 0; tick < 90; tick += 1) {
    step(state, { move: 0, jump: tick < taps });
    top = Math.min(top, state.player.y);
  }
  return (ground - top) / FX;
};

describe('levels', () => {
  it('rejects rows of different widths', () => {
    expect(() => levelOf(['S F G', '####'])).toThrow(/wide/);
  });

  it('needs exactly one start and one exit', () => {
    expect(() => levelOf(['S F ', '####'])).toThrow(/'G'/);
  });
});

describe('the jump', () => {
  it('rises about 2.75 tiles when jump is held', () => {
    const height = peakHeight(90);
    expect(height).toBeGreaterThan(40);
    expect(height).toBeLessThan(48);
  });

  it('is a short hop when jump is tapped', () => {
    expect(peakHeight(1)).toBeLessThan(peakHeight(90) / 2);
  });

  it('passes up through a one-way platform and lands on it', () => {
    const rows = [...sky(8, 8), ' ===    ', '  S F  G', '########'];
    const state = runOf(rows);
    play(state, JUMP, 60);
    expect(state.player.y + PLAYER.height).toBe(8 * TILE);
    expect(state.player.grounded).toBe(true);
  });

  it('still jumps a few ticks after walking off a ledge', () => {
    const rows = [...sky(12, 9), 'S F       G ', '####   #####'];
    const state = runOf(rows);
    while (state.player.grounded || state.player.vy === 0) step(state, RIGHT);
    play(state, RIGHT, PLAYER.coyoteTicks - 2);
    expect(step(state, { move: 1, jump: true })).toContainEqual({ kind: 'jump' });
  });
});

describe('collecting and the exit', () => {
  it('scores a flag and opens the exit when the last one is taken', () => {
    const state = runOf(FLAT);
    const events = play(state, RIGHT, 30);
    expect(events).toContainEqual({ kind: 'collect', index: 0 });
    expect(events).toContainEqual({ kind: 'exitOpen' });
    expect(state.score).toBe(SCORE.collect);
  });

  it('clears the level at the open exit with the never-caught bonus', () => {
    const state = runOf(FLAT);
    const events = play(state, RIGHT, 120);
    const clear = events.find((event) => event.kind === 'clear');
    const seconds = Math.trunc(state.tick / TICKS_PER_SECOND);
    expect(clear).toEqual({
      kind: 'clear',
      bonus:
        SCORE.clear + (SCORE.parSeconds - seconds) * SCORE.timeBonusPerSecond + SCORE.neverCaught,
    });
    expect(state.phase).toBe('clear');
  });

  it('keeps the exit shut until every flag is collected', () => {
    const state = runOf([...sky(12, 9), 'S       G F ', '############']);
    const events = play(state, RIGHT, 45);
    expect(events.some((event) => event.kind === 'clear')).toBe(false);
  });
});

describe('patrol police', () => {
  const PATROL_ROWS = [...sky(16, 9), 'S F    P      G ', '################'];

  it('tires, dozes off for 3 seconds, then wakes with full energy', () => {
    const state = runOf(PATROL_ROWS);
    const [patrol] = state.patrols;
    if (patrol === undefined) throw new Error('no patrol');
    let ticks = 0;
    while (!updatePatrol(state.level, patrol)) ticks += 1;
    expect(ticks).toBeLessThan(PATROL.energyMax);
    for (let tick = 0; tick < PATROL.sleepTicks; tick += 1) updatePatrol(state.level, patrol);
    expect(patrol.sleep).toBe(0);
    expect(patrol.energy).toBe(PATROL.energyMax);
  });

  it('jails you when you touch him awake', () => {
    const state = runOf(PATROL_ROWS);
    const events = play(state, RIGHT, 60);
    expect(events).toContainEqual({ kind: 'caught', cause: 'patrol' });
    expect(state.lives).toBe(RULES.lives - 1);
  });

  it('lets you walk past while he is asleep', () => {
    const state = runOf(PATROL_ROWS);
    state.patrols.forEach((patrol) => {
      patrol.sleep = PATROL.sleepTicks;
    });
    const events = play(state, RIGHT, 60);
    expect(events.some((event) => event.kind === 'caught')).toBe(false);
  });
});

describe('hazards and lives', () => {
  it('jails you in a police-van cell', () => {
    const state = runOf([...sky(12, 9), 'S F J     G ', '############']);
    expect(play(state, RIGHT, 40)).toContainEqual({ kind: 'caught', cause: 'jail' });
  });

  it('catches you in a fire pit', () => {
    const state = runOf([...sky(12, 9), 'S F       G ', '#####~~#####']);
    expect(play(state, RIGHT, 60)).toContainEqual({ kind: 'caught', cause: 'fire' });
    expect(state.cause).toBe('fire');
  });

  it.each([
    ['polluted river', 'W', 'river'],
    ['pothole', 'O', 'pothole'],
  ] as const)('catches you in a %s', (_, tile, cause) => {
    const state = runOf([...sky(12, 9), 'S F       G ', `#####${tile}${tile}#####`]);
    expect(play(state, RIGHT, 60)).toContainEqual({ kind: 'caught', cause });
  });

  it('lets you walk under smog but chokes you if you jump into it', () => {
    const rows = [...sky(12, 8), '    AAA     ', 'S F       G ', '############'];
    const walker = runOf(rows);
    expect(play(walker, RIGHT, 50).some((event) => event.kind === 'caught')).toBe(false);
    const jumper = runOf(rows);
    play(jumper, RIGHT, 30);
    expect(play(jumper, { move: 1, jump: true }, 20)).toContainEqual({
      kind: 'caught',
      cause: 'smog',
    });
  });

  it('respawns at the start after a capture', () => {
    const state = runOf([...sky(12, 9), 'S F J     G ', '############']);
    play(state, RIGHT, 40);
    const events = play(state, { move: 0, jump: false }, RULES.caughtTicks);
    expect(events).toContainEqual({ kind: 'respawn' });
    expect(state.phase).toBe('play');
  });

  it('ends the run when the last life is lost', () => {
    const state = runOf([...sky(12, 9), 'S F J     G ', '############']);
    state.lives = 1;
    play(state, RIGHT, 40);
    expect(play(state, { move: 0, jump: false }, RULES.caughtTicks)).toContainEqual({
      kind: 'over',
    });
    expect(state.phase).toBe('over');
  });
});
