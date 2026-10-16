import { describe, expect, it } from 'vitest';
import {
  CONTROL_START,
  COCKROACH_START_SWARM,
  createRun,
  EndReason,
  EventKind,
  EVENT_STRIDE,
  LAWN_THRESHOLD,
  MAX_ACTIVE,
  RESPAWN_IMMUNITY,
  RUN_TICKS,
  SMASH_SYMPATHY,
  step,
  swarmOf,
  SYMPATHY_DECAY_DELAY,
  SYMPATHY_MAX,
  TAP_COOLDOWN,
} from '../src/index.ts';
import { spawnAtMetro } from '../src/roaches.ts';
import { resultSystem } from '../src/systems/result.ts';
import {
  advance,
  agencyRun,
  aliveSlots,
  COCKROACH,
  firstSmashable,
  tapInput,
  tapSlot,
  worldOf,
} from './helpers.ts';

describe('the evening', () => {
  it('spawns one roach at the metro every 2 s before 6 PM', () => {
    const state = agencyRun();
    advance(state, 1);
    expect(state.became).toBe(1);
    advance(state, 120);
    expect(state.became).toBe(2);
  });

  it('grows the metro batch by one per 30 game minutes from 6 PM', () => {
    const state = createRun(COCKROACH);
    advance(state, 30 * 60);
    const before = state.became;
    advance(state, 1);
    expect(state.became - before).toBe(2);
  });

  it('opens the six C-Hexagon roads at 7 PM', () => {
    const state = createRun(COCKROACH);
    advance(state, 90 * 60);
    const metroOnly = state.became;
    advance(state, 1);
    expect(state.became - metroOnly).toBe(4 + 6);
  });

  it('starts cockroach runs with 30 roaches at the metro', () => {
    const state = createRun(COCKROACH);
    expect(state.active).toBe(COCKROACH_START_SWARM);
  });
});

describe('the Hydra rule', () => {
  it('replaces a smashed roach with 3 faster roaches at the metro', () => {
    const state = agencyRun();
    advance(state, 200);
    const slot = firstSmashable(state);
    const parentGen = state.roaches.gen[slot] ?? 0;
    const swarm = swarmOf(state);
    const became = state.became;
    tapSlot(state, slot);
    expect(state.smashes).toBe(1);
    expect(swarmOf(state)).toBe(swarm + 2);
    expect(state.became).toBe(became + 3);
    const children = aliveSlots(state).filter((s) => (state.roaches.gen[s] ?? 0) === parentGen + 1);
    expect(children).toHaveLength(3);
  });

  it('keeps respawned children unsmashable for 30 ticks', () => {
    const state = agencyRun();
    advance(state, 200);
    tapSlot(state, firstSmashable(state));
    const child = aliveSlots(state).find((s) => (state.roaches.gen[s] ?? 0) === 1) ?? -1;
    expect(state.roaches.immuneUntil[child]).toBe(state.tick - 1 + RESPAWN_IMMUNITY);
    const smashes = state.smashes;
    advance(state, TAP_COOLDOWN);
    tapSlot(state, child);
    expect(state.smashes).toBe(smashes);
  });

  it('smashes every roach inside the 24-unit radius with one tap', () => {
    const state = agencyRun();
    advance(state, 1);
    spawnAtMetro(state, 0, 0);
    spawnAtMetro(state, 0, 0);
    const [first = 0, ...rest] = aliveSlots(state);
    for (const slot of rest) {
      state.roaches.x[slot] = state.roaches.x[first] ?? 0;
      state.roaches.y[slot] = state.roaches.y[first] ?? 0;
    }
    const { x, y } = worldOf(state, first);
    step(state, [tapInput(state, x, y)]);
    expect(state.smashes).toBe(3);
  });
});

describe('taps', () => {
  it('does nothing on empty ground but reports the miss', () => {
    const state = agencyRun();
    step(state, [tapInput(state, 10, 700)]);
    expect(state.smashes).toBe(0);
    expect(state.events[0]).toBe(EventKind.Tap);
    expect(state.events[3]).toBe(0);
    expect(state.eventCount * EVENT_STRIDE).toBe(EVENT_STRIDE);
  });

  it('allows one smash per 8 ticks per finger, fingers independent', () => {
    const state = agencyRun();
    advance(state, 400);
    tapSlot(state, firstSmashable(state), 0);
    tapSlot(state, firstSmashable(state), 0);
    expect(state.smashes).toBe(1);
    tapSlot(state, firstSmashable(state), 1);
    expect(state.smashes).toBe(2);
    advance(state, TAP_COOLDOWN);
    tapSlot(state, firstSmashable(state), 0);
    expect(state.smashes).toBe(3);
  });

  it('ignores taps from the cockroach side', () => {
    const state = createRun(COCKROACH);
    advance(state, 60);
    tapSlot(state, firstSmashable(state));
    expect(state.smashes).toBe(0);
  });
});

describe('Public Sympathy', () => {
  it('rises 1 point per smash and decays 0.5 per second after 3 s', () => {
    const state = agencyRun();
    advance(state, 200);
    tapSlot(state, firstSmashable(state));
    expect(state.sympathy).toBe(SMASH_SYMPATHY);
    advance(state, SYMPATHY_DECAY_DELAY - 2);
    expect(state.sympathy).toBe(SMASH_SYMPATHY);
    advance(state, 61);
    expect(state.sympathy).toBe(SMASH_SYMPATHY - 60);
  });

  it('pulls 5 lawn roaches a second at 100% sympathy', () => {
    const state = agencyRun();
    advance(state, 1);
    state.sympathy = SYMPATHY_MAX;
    state.lastSmashTick = Number.MAX_SAFE_INTEGER;
    const before = state.became;
    advance(state, 60);
    expect(state.became - before).toBe(5);
    expect(LAWN_THRESHOLD).toBe(144000);
  });
});

describe('the arch and the cap', () => {
  it('costs 1 Control per roach entering, and the Agency is overrun at 0', () => {
    const state = agencyRun();
    while (state.endReason === EndReason.None) step(state, []);
    expect(state.control).toBe(0);
    expect(state.endReason).toBe(EndReason.Overrun);
    expect(state.endTick).toBeLessThan(RUN_TICKS);
    expect(CONTROL_START).toBe(100);
  });

  it('holds at most 400 active roaches and queues the rest at the metro', () => {
    const state = agencyRun();
    for (let i = 0; i < MAX_ACTIVE + 50; i += 1) spawnAtMetro(state, 2, 0);
    expect(state.active).toBe(MAX_ACTIVE);
    expect(state.queued).toBe(50);
    expect(state.queue[2]).toBe(50);
    expect(swarmOf(state)).toBe(MAX_ACTIVE + 50);
  });

  it('counts Reached for the cockroach side and ends at 9 PM', () => {
    const state = createRun(COCKROACH);
    while (state.endReason === EndReason.None) step(state, []);
    expect(state.endTick).toBe(RUN_TICKS);
    expect(state.reached).toBeGreaterThan(0);
    expect([EndReason.ReachedGate, EndReason.NextExam]).toContain(state.endReason);
  });

  it('lets an overrun win when Control hits 0 on the 9 PM tick', () => {
    const state = agencyRun();
    state.tick = RUN_TICKS;
    state.control = 0;
    resultSystem(state);
    expect(state.endReason).toBe(EndReason.Overrun);
  });
});
