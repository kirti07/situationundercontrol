import { describe, expect, it } from 'vitest';
import {
  ACT_MINUTE,
  AI_BARRICADE_INTERVAL,
  AI_BARRICADE_MAX,
  CLIMB_THRESHOLD,
  createRun,
  EventKind,
  EVENT_STRIDE,
  InputKind,
  MAX_ACTIVE,
  Pace,
  paceOf,
  MARCH_DENOMINATOR,
  MARCH_NUMERATOR,
  NOT_SCHEDULED,
  PERFECT_SIT_IN_JOINERS,
  PERFECT_SIT_IN_SYMPATHY,
  RoachMode,
  Side,
  SIT_IN_CHARGE,
  SIT_IN_DURATION,
  SIT_IN_SYMPATHY,
  STAMP_INTERVAL,
  STAMP_SYMPATHY,
  STAMP_WARNING,
  STRAY_TICKS,
  step,
  SUB,
  TICKS_PER_MINUTE,
  type Input,
  type State,
} from '../src/index.ts';
import { raiseBarricade, barricadeCount } from '../src/barricades.ts';
import { densestCluster, clusterCenterX, clusterCenterY } from '../src/density.ts';
import { cellOf, NEAREST_OPEN, PASSABLE } from '../src/map.ts';
import { spawnAt } from '../src/roaches.ts';
import { barricadeSystem } from '../src/systems/barricade.ts';
import { advance, aliveSlots, COCKROACH } from './helpers.ts';

const input = (state: State, kind: Input['kind'], x = 0, y = 0, pointer = 0): Input => ({
  tick: state.tick,
  kind,
  pointer,
  x,
  y,
});

const eventsOf = (state: State, kind: number): number[] =>
  Array.from({ length: state.eventCount }, (_, i) => i * EVENT_STRIDE).filter(
    (at) => state.events[at] === kind,
  );

const cockroachRun = (): State => createRun(COCKROACH);

describe('the march', () => {
  it('walks unled cockroach-side roaches at two-sevenths of the Agency pace', () => {
    const march = (setup: typeof COCKROACH): number => {
      const state = createRun(setup);
      spawnAt(state, 180, 500);
      const slot = state.free[state.freeCount] ?? 0;
      const before = state.roaches.y[slot] ?? 0;
      advance(state, 60);
      return before - (state.roaches.y[slot] ?? 0);
    };
    const walked = march(COCKROACH);
    const ran = march({ ...COCKROACH, side: Side.Agency });
    expect(walked).toBeGreaterThan(0);
    expect(Math.abs(walked * MARCH_DENOMINATOR - ran * MARCH_NUMERATOR)).toBeLessThan(SUB * 2);
  });

  it('places perfect sit-in joiners on open ground, never in a canal', () => {
    const canal = cellOf(90, 300);
    expect(PASSABLE[canal]).toBe(0);
    expect(PASSABLE[NEAREST_OPEN[canal] ?? 0]).toBe(1);
  });
});

describe('drag to lead', () => {
  const emptyRun = (): State => {
    const state = cockroachRun();
    state.roaches.alive.fill(0);
    state.free.set(Int32Array.from({ length: MAX_ACTIVE }, (_, i) => MAX_ACTIVE - 1 - i));
    state.freeCount = MAX_ACTIVE;
    state.active = 0;
    return state;
  };
  const steer = (state: State, x: number, y: number): void => {
    step(state, [input(state, InputKind.Steer, x, y)]);
  };

  it('walks roaches inside the rally circle through the finger', () => {
    const state = emptyRun();
    spawnAt(state, 180, 560);
    steer(state, 180, 480);
    const [slot = 0] = aliveSlots(state);
    const gaps = Array.from({ length: 300 }, () => {
      step(state, []);
      return Math.abs((state.roaches.y[slot] ?? 0) / SUB - 480);
    });
    expect(Math.min(...gaps)).toBeLessThan(12);
  });

  it('chants close to the finger and lets stragglers dawdle after the grace period', () => {
    const state = emptyRun();
    spawnAt(state, 180, 500);
    spawnAt(state, 66, 560);
    steer(state, 180, 480);
    const [near = 0, far = 0] = aliveSlots(state);
    expect(paceOf(state, near)).toBe(Pace.Chant);
    expect(paceOf(state, far)).toBe(Pace.March);
    advance(state, STRAY_TICKS + 1);
    expect(paceOf(state, far)).toBe(Pace.Dawdle);
  });

  it('carries roaches already past the finger on toward the arch', () => {
    const state = emptyRun();
    spawnAt(state, 180, 300);
    steer(state, 180, 380);
    const [slot = 0] = aliveSlots(state);
    const before = state.roaches.y[slot] ?? 0;
    advance(state, 60);
    expect(state.roaches.y[slot] ?? 0).toBeLessThan(before);
  });

  it('drops the rally point when the finger lifts, and the swarm dawdles', () => {
    const state = emptyRun();
    spawnAt(state, 180, 500);
    steer(state, 180, 480);
    step(state, [input(state, InputKind.SteerEnd)]);
    expect(state.steering.cell).toBe(NOT_SCHEDULED);
    expect(paceOf(state, aliveSlots(state)[0] ?? 0)).toBe(Pace.Dawdle);
  });

  it('never slows Agency roaches', () => {
    const state = createRun({ ...COCKROACH, side: Side.Agency });
    advance(state, 2);
    expect(paceOf(state, aliveSlots(state)[0] ?? 0)).toBe(Pace.March);
  });
});

describe('Sit-in', () => {
  const sitInAt6 = (): State => {
    const state = cockroachRun();
    advance(state, ACT_MINUTE * TICKS_PER_MINUTE);
    step(state, [input(state, InputKind.SitIn)]);
    return state;
  };

  it('is locked before 6 PM', () => {
    const state = cockroachRun();
    step(state, [input(state, InputKind.SitIn)]);
    expect(state.timers.sitInUntil).toBe(0);
  });

  it('stops the swarm for 2 s and adds 25 Sympathy', () => {
    const state = sitInAt6();
    expect(state.timers.sitInUntil).toBe(state.tick - 1 + SIT_IN_DURATION);
    expect(state.sympathy).toBeGreaterThanOrEqual(SIT_IN_SYMPATHY);
    const before = aliveSlots(state).map((slot) => state.roaches.y[slot]);
    step(state, []);
    const after = aliveSlots(state)
      .slice(0, before.length)
      .map((slot) => state.roaches.y[slot]);
    expect(after).toEqual(before.slice(0, after.length));
  });

  it('recharges for 15 s', () => {
    const state = sitInAt6();
    const until = state.timers.sitInUntil;
    advance(state, SIT_IN_CHARGE - 2);
    step(state, [input(state, InputKind.SitIn)]);
    expect(state.timers.sitInUntil).toBe(until);
    step(state, [input(state, InputKind.SitIn)]);
    expect(state.timers.sitInUntil).toBeGreaterThan(until);
  });

  const atWarning = (): State => {
    const state = cockroachRun();
    advance(state, ACT_MINUTE * TICKS_PER_MINUTE);
    while (state.stamp.landsAt === NOT_SCHEDULED) step(state, []);
    return state;
  };

  it('is perfect under a stamp warning: double Sympathy, joiners, and the stamp bounces', () => {
    const state = atWarning();
    const became = state.became;
    const sympathy = state.sympathy;
    step(state, [input(state, InputKind.SitIn)]);
    expect(state.sympathy - sympathy).toBe(PERFECT_SIT_IN_SYMPATHY);
    expect(state.became - became).toBeGreaterThanOrEqual(PERFECT_SIT_IN_JOINERS);
    expect(eventsOf(state, EventKind.PerfectSitIn)).toHaveLength(1);
    const smashes = state.smashes;
    while (state.stamp.landsAt !== NOT_SCHEDULED) step(state, []);
    expect(state.smashes).toBe(smashes);
  });

  it('is still perfect on the tick the stamp lands, and the stamp bounces', () => {
    const state = atWarning();
    while (state.stamp.landsAt !== state.tick) step(state, []);
    const smashes = state.smashes;
    step(state, [input(state, InputKind.SitIn)]);
    expect(eventsOf(state, EventKind.PerfectSitIn)).toHaveLength(1);
    expect(eventsOf(state, EventKind.Bounce)).toHaveLength(1);
    expect(state.smashes).toBe(smashes);
  });

  it('is an ordinary sit-in with no stamp coming', () => {
    const state = atWarning();
    while (state.stamp.landsAt !== NOT_SCHEDULED) step(state, []);
    const sympathy = state.sympathy;
    step(state, [input(state, InputKind.SitIn)]);
    expect(state.sympathy - sympathy).toBe(SIT_IN_SYMPATHY);
    expect(eventsOf(state, EventKind.PerfectSitIn)).toHaveLength(0);
  });
});

describe('Agency AI', () => {
  it('warns 0.8 s before each stamp lands on the densest cluster', () => {
    const state = cockroachRun();
    advance(state, STAMP_INTERVAL);
    step(state, []);
    expect(eventsOf(state, EventKind.StampWarn)).toHaveLength(1);
    expect(state.stamp.landsAt).toBe(state.tick - 1 + STAMP_WARNING);
    advance(state, STAMP_WARNING - 1);
    step(state, []);
    expect(eventsOf(state, EventKind.StampLand)).toHaveLength(1);
    expect(state.smashes).toBeGreaterThan(0);
    expect(state.sympathy).toBe(state.smashes * STAMP_SYMPATHY);
  });

  it('adds a barricade every 30 s, at most 3', () => {
    const state = cockroachRun();
    advance(state, AI_BARRICADE_INTERVAL * 5 + 1);
    expect(barricadeCount(state)).toBe(AI_BARRICADE_MAX);
  });

  it('breaks density ties toward the top-left', () => {
    const state = cockroachRun();
    aliveSlots(state).forEach((slot, i) => {
      state.roaches.x[slot] = (i % 2 === 0 ? 300 : 20) * SUB;
      state.roaches.y[slot] = (i % 2 === 0 ? 300 : 700) * SUB;
    });
    const cluster = densestCluster(state);
    expect(clusterCenterX(cluster) / SUB).toBe(300);
    expect(clusterCenterY(cluster) / SUB).toBe(300);
  });
});

describe('barricades', () => {
  const piledRun = (count: number): State => {
    const state = cockroachRun();
    raiseBarricade(state, 1, 400);
    for (let i = 0; i < count; i += 1) {
      spawnAt(state, 150 + i, 402);
    }
    for (const slot of aliveSlots(state).slice(-count)) {
      state.roaches.py[slot] = 402 * SUB;
      state.roaches.y[slot] = 398 * SUB;
    }
    barricadeSystem(state);
    return state;
  };

  it('piles roaches behind a barricade', () => {
    const state = piledRun(CLIMB_THRESHOLD - 1);
    expect(state.barricades.pile[0]).toBe(CLIMB_THRESHOLD - 1);
  });

  it('pours the pile over at 25 and keeps the barricade', () => {
    const state = piledRun(CLIMB_THRESHOLD);
    expect(state.barricades.pile[0]).toBe(0);
    expect(state.barricades.lane[0]).toBe(1);
    const climbing = aliveSlots(state).filter(
      (slot) => state.roaches.mode[slot] === RoachMode.Climbing,
    );
    expect(climbing).toHaveLength(CLIMB_THRESHOLD);
  });
});
