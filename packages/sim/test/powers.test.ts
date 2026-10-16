import { describe, expect, it } from 'vitest';
import {
  ACT_MINUTE,
  Character,
  createRun,
  EndReason,
  FREEZE_DURATION,
  InputKind,
  LISTEN_HOLD,
  POWER_CHARGE,
  SILENCE_DURATION,
  Side,
  step,
  SYMPATHY_MAX,
  TICKS_PER_MINUTE,
  type Input,
  type State,
} from '../src/index.ts';
import { barricadeCount } from '../src/barricades.ts';
import { advance, aliveSlots, firstSmashable, tapSlot } from './helpers.ts';

const ACT_TICK = ACT_MINUTE * TICKS_PER_MINUTE;

const press = (state: State, kind: Input['kind']): void => {
  step(state, [{ tick: state.tick, kind, pointer: 0, x: 0, y: 0 }]);
};

const agencyAt6 = (character: Character): State => {
  const state = createRun({ seed: 7, side: Side.Agency, character });
  state.control = 1_000_000;
  advance(state, ACT_TICK);
  return state;
};

describe('Power button', () => {
  it('is locked before 6 PM', () => {
    const state = createRun({ seed: 7, side: Side.Agency, character: Character.Chanakya });
    advance(state, 60);
    press(state, InputKind.Power);
    expect(barricadeCount(state)).toBe(0);
  });

  it('recharges for 20 s', () => {
    const state = agencyAt6(Character.PradhanSevak);
    press(state, InputKind.Power);
    expect(state.timers.powerReadyAt).toBe(state.tick - 1 + POWER_CHARGE);
    const ready = state.timers.powerReadyAt;
    press(state, InputKind.Power);
    expect(state.timers.powerReadyAt).toBe(ready);
  });
});

describe('Prime Time: The Nation Demands', () => {
  it('freezes the densest cluster for 8 s, then 30% spawn on the roads (rounded down)', () => {
    const state = agencyAt6(Character.PrimeTime);
    press(state, InputKind.Power);
    const frozen = state.timers.frozenCount;
    expect(frozen).toBeGreaterThan(0);
    const frozenSlot =
      aliveSlots(state).find((slot) => (state.roaches.frozenUntil[slot] ?? 0) > state.tick) ?? 0;
    const y = state.roaches.y[frozenSlot];
    step(state, []);
    expect(state.roaches.y[frozenSlot]).toBe(y);
    advance(state, FREEZE_DURATION - 2);
    const became = state.became;
    step(state, []);
    expect(state.timers.frozenCount).toBe(0);
    expect(state.became - became).toBeGreaterThanOrEqual(Math.floor((frozen * 3) / 10));
  });
});

describe('Chanakya: Masterstroke', () => {
  it('barricades all three lanes', () => {
    const state = agencyAt6(Character.Chanakya);
    press(state, InputKind.Power);
    expect(barricadeCount(state)).toBe(3);
    advance(state, POWER_CHARGE);
    press(state, InputKind.Power);
    expect(barricadeCount(state)).toBe(3);
  });
});

describe('Pradhan Sevak: Mann Ki Baat', () => {
  it('zeroes Sympathy, stops the lawns and locks smashing for 20 s', () => {
    const state = agencyAt6(Character.PradhanSevak);
    state.sympathy = SYMPATHY_MAX;
    press(state, InputKind.Power);
    expect(state.sympathy).toBe(0);
    const smashes = state.smashes;
    tapSlot(state, firstSmashable(state));
    expect(state.smashes).toBe(smashes);
    expect(state.timers.silencedUntil).toBe(state.tick - 2 + SILENCE_DURATION);
    advance(state, SILENCE_DURATION);
    tapSlot(state, firstSmashable(state));
    expect(state.smashes).toBe(smashes + 1);
  });
});

describe('Actually Listen', () => {
  it('ends the run as RESULTS DECLARED ON TIME after a 1 s hold', () => {
    const state = createRun({ seed: 7, side: Side.Agency, character: Character.Chanakya });
    press(state, InputKind.ListenDown);
    advance(state, LISTEN_HOLD - 2);
    expect(state.endReason).toBe(EndReason.None);
    step(state, []);
    expect(state.endReason).toBe(EndReason.Listened);
  });

  it('cancels when released early', () => {
    const state = createRun({ seed: 7, side: Side.Agency, character: Character.Chanakya });
    press(state, InputKind.ListenDown);
    advance(state, LISTEN_HOLD - 10);
    press(state, InputKind.ListenUp);
    advance(state, LISTEN_HOLD);
    expect(state.endReason).toBe(EndReason.None);
  });

  it('does not exist for the cockroaches', () => {
    const state = createRun({ seed: 7, side: Side.Cockroach, character: Character.None });
    press(state, InputKind.ListenDown);
    advance(state, LISTEN_HOLD * 2);
    expect(state.endReason).toBe(EndReason.None);
  });
});
