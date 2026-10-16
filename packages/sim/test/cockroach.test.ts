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
  RoachMode,
  SIT_IN_CHARGE,
  SIT_IN_DURATION,
  SIT_IN_SYMPATHY,
  STAMP_INTERVAL,
  STAMP_WARNING,
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

describe('steering', () => {
  it('walks the swarm toward the first finger', () => {
    const state = cockroachRun();
    step(state, [input(state, InputKind.Steer, 60, 500)]);
    advance(state, 600);
    const starters = aliveSlots(state).filter((slot) => (state.roaches.id[slot] ?? 0) < 30);
    const near = starters.filter((slot) => (state.roaches.x[slot] ?? 0) < 110 * SUB);
    expect(near.length).toBe(starters.length);
  });

  it('ignores the second finger', () => {
    const state = cockroachRun();
    step(state, [input(state, InputKind.Steer, 60, 500, 1)]);
    expect(state.steering.cell).toBe(-1);
  });

  it('routes a finger on a canal to the nearest open ground', () => {
    const canal = cellOf(118, 300);
    expect(PASSABLE[canal]).toBe(0);
    expect(PASSABLE[NEAREST_OPEN[canal] ?? 0]).toBe(1);
  });

  it('marches straight up again when the finger lifts', () => {
    const state = cockroachRun();
    step(state, [input(state, InputKind.Steer, 60, 500)]);
    step(state, [input(state, InputKind.SteerEnd)]);
    expect(state.steering.cell).toBe(-1);
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

  it('stops the swarm for 4 s and adds 10 Sympathy', () => {
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

  it('wins against a stamp landing on the same tick', () => {
    const state = cockroachRun();
    advance(state, ACT_MINUTE * TICKS_PER_MINUTE);
    while (state.stamp.landsAt !== state.tick) step(state, []);
    const smashes = state.smashes;
    step(state, [input(state, InputKind.SitIn)]);
    expect(state.smashes).toBe(smashes);
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
