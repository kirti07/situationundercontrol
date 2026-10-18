import { describe, expect, it } from 'vitest';
import {
  CAUGHT_SYMPATHY,
  CAUGHT_SURGE,
  createRun,
  EVENT_STRIDE,
  EventKind,
  FIRST_MOMENT_AT,
  FIRST_MOMENT_WINDOW,
  InputKind,
  isOver,
  MomentKind,
  MOMENT_GAP,
  PLACARD_RIGHT_SYMPATHY,
  PLACARD_SURGE,
  Role,
  RUN_TICKS,
  step,
  SUB,
  STAMP_INTERVAL,
  SYMPATHY_SCALE,
  type Input,
  type State,
} from '../src/index.ts';
import { advance, aliveSlots, AGENCY, COCKROACH } from './helpers.ts';

const cockroachRun = (): State => createRun(COCKROACH);

const send = (state: State, kind: Input['kind'], x = 0, y = 0): void => {
  step(state, [{ tick: state.tick, kind, pointer: 0, x, y }]);
};

const eventsOf = (state: State, kind: number): number[] =>
  Array.from({ length: state.eventCount }, (_, i) => i * EVENT_STRIDE).filter(
    (at) => state.events[at] === kind,
  );

const until = (state: State, kind: MomentKind): void => {
  while (state.moment.kind !== kind && !isOver(state)) step(state, []);
};

const runWith = (kind: MomentKind): State => {
  for (let seed = 1; seed < 64; seed += 1) {
    const state = createRun({ ...COCKROACH, seed });
    until(state, kind);
    if (state.moment.kind === kind) return state;
  }
  throw new Error(`No edition dealt moment ${String(kind)}`);
};

const cardsOf = (state: State): number[] => Array.from(state.moment.cards.subarray(0, 2));

const worldOf = (state: State, slot: number): readonly [number, number] => [
  Math.floor((state.roaches.x[slot] ?? 0) / SUB),
  Math.floor((state.roaches.y[slot] ?? 0) / SUB),
];

describe('moment schedule', () => {
  it('opens the first placard duel 10 s in, with a 6 s window', () => {
    const state = cockroachRun();
    advance(state, FIRST_MOMENT_AT + 1);
    expect(state.moment.kind).toBe(MomentKind.Placard);
    expect(state.moment.closesAt - state.moment.opensAt).toBe(FIRST_MOMENT_WINDOW);
  });

  it('closes an unanswered moment as ignored and waits before the next', () => {
    const state = cockroachRun();
    until(state, MomentKind.Placard);
    const closesAt = state.moment.closesAt;
    advance(state, closesAt - state.tick + 1);
    expect(state.moment.kind).toBe(MomentKind.None);
    expect(state.moment.closed).toBe(1);
    expect(state.moment.won).toBe(0);
    expect(state.moment.nextAt).toBeGreaterThan(state.tick);
  });

  it('deals every player of an edition the same moments, whatever they do', () => {
    const dealt = (answer: boolean): string[] => {
      const state = cockroachRun();
      const seen: string[] = [];
      while (seen.length < 8 && !isOver(state)) {
        const answerNow = answer && state.moment.kind === MomentKind.Placard;
        if (answerNow) send(state, InputKind.Answer, 0);
        else step(state, []);
        if (eventsOf(state, EventKind.MomentOpen).length === 0) continue;
        seen.push(`${String(state.moment.kind)}:${cardsOf(state).join(',')}`);
      }
      return seen;
    };
    const kindsOnly = (cards: string[]): string[] =>
      cards.filter((card) => !card.startsWith(`${String(MomentKind.Fake)}:`));
    expect(kindsOnly(dealt(true))).toEqual(kindsOnly(dealt(false)));
  });

  it('runs no moments on the Agency side', () => {
    const state = createRun(AGENCY);
    advance(state, FIRST_MOMENT_AT * 20);
    expect(state.moment.kind).toBe(MomentKind.None);
    expect(state.moment.closed).toBe(0);
  });
});

describe('spot the fake protester', () => {
  it('catches the fake: SUS, Sympathy, a surge, and the next stamp is called off', () => {
    const state = runWith(MomentKind.Fake);
    const fake = state.moment.cards[1] ?? 0;
    expect(state.roaches.role[fake]).toBe(Role.Fake);
    const sympathy = state.sympathy;
    send(state, InputKind.Tap, ...worldOf(state, fake));
    expect(eventsOf(state, EventKind.Caught)).toHaveLength(1);
    expect(state.moment.won).toBeGreaterThan(0);
    expect(state.sympathy - sympathy).toBeGreaterThanOrEqual(CAUGHT_SYMPATHY);
    expect(state.stamp.calledOff).toBe(true);
    expect(state.timers.surgeUntil - state.tick).toBe(CAUGHT_SURGE - 1);
  });

  it('sends a wrongly accused comrade home with friends, and keeps looking', () => {
    const state = runWith(MomentKind.Fake);
    const fake = state.moment.cards[1] ?? 0;
    const comrade = aliveSlots(state).find(
      (slot) =>
        slot !== fake &&
        Math.abs((state.roaches.x[slot] ?? 0) - (state.roaches.x[fake] ?? 0)) > 30 * SUB,
    );
    const active = state.active;
    send(state, InputKind.Tap, ...worldOf(state, comrade ?? 0));
    expect(eventsOf(state, EventKind.WrongAccuse)).toHaveLength(1);
    expect(state.active).toBeLessThan(active);
    expect(state.moment.kind).toBe(MomentKind.Fake);
  });

  it('pinpoints the next stamp when the fake gets away', () => {
    const state = runWith(MomentKind.Fake);
    state.roaches.immuneUntil[state.moment.cards[1] ?? 0] = RUN_TICKS;
    while (state.moment.kind === MomentKind.Fake) step(state, []);
    expect(state.moment.won).toBe(0);
    let pinpointed = 0;
    for (let i = 0; i <= STAMP_INTERVAL && pinpointed === 0; i += 1) {
      step(state, []);
      pinpointed = eventsOf(state, EventKind.Pinpointed).length;
    }
    expect(pinpointed).toBe(1);
    expect(state.stamp.wide).toBe(true);
  });
});

describe('a stamp lands on the fake', () => {
  it('counts as caught: MASTERSTROKE, the Agency stamped its own officer', () => {
    const state = runWith(MomentKind.Fake);
    const fake = state.moment.cards[1] ?? 0;
    state.timers.sitInUntil = 0;
    state.stamp.x = state.roaches.x[fake] ?? 0;
    state.stamp.y = state.roaches.y[fake] ?? 0;
    state.stamp.landsAt = state.tick;
    state.roaches.immuneUntil[fake] = 0;
    step(state, []);
    const caught = eventsOf(state, EventKind.Caught);
    expect(caught).toHaveLength(1);
    expect(state.events[(caught[0] ?? 0) + 3]).toBe(1);
    expect(state.moment.kind).toBe(MomentKind.None);
  });
});

describe('placard duel', () => {
  it('rewards the placard that answers the ticker and punishes the other', () => {
    const right = runWith(MomentKind.Placard);
    const sympathy = right.sympathy;
    send(right, InputKind.Answer, right.moment.cards[1] ?? 0);
    expect(right.sympathy - sympathy).toBe(PLACARD_RIGHT_SYMPATHY);
    expect(right.timers.surgeUntil - right.tick).toBe(PLACARD_SURGE - 1);

    const wrong = runWith(MomentKind.Placard);
    wrong.sympathy = 20 * SYMPATHY_SCALE;
    send(wrong, InputKind.Answer, 1 - (wrong.moment.cards[1] ?? 0));
    expect(wrong.sympathy).toBeLessThan(20 * SYMPATHY_SCALE);
    expect(wrong.moment.kind).toBe(MomentKind.None);
    expect(wrong.timers.surgeUntil).toBe(0);
  });

  it('comes once in a while: 30 s between moments', () => {
    const state = runWith(MomentKind.Placard);
    send(state, InputKind.Answer, 0);
    expect(state.moment.nextAt - state.tick).toBe(MOMENT_GAP - 1);
  });
});

describe('surge', () => {
  it('makes the whole swarm chant at 1.5x while it lasts', () => {
    const distance = (surge: boolean): number => {
      const state = createRun(COCKROACH);
      advance(state, 2);
      state.timers.surgeUntil = surge ? state.tick + 120 : 0;
      const [slot = 0] = aliveSlots(state);
      const before = state.roaches.y[slot] ?? 0;
      advance(state, 30);
      return before - (state.roaches.y[slot] ?? 0);
    };
    expect(distance(true)).toBeGreaterThan(distance(false) * 4);
  });
});
