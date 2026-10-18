import {
  ACT_MINUTE,
  AI_BARRICADE_INTERVAL,
  BARRICADE_SLOTS,
  CONTROL_START,
  EVENT_CAPACITY,
  FIRST_MOMENT_AT,
  LATHI_MAX,
  MAX_ACTIVE,
  MAX_GENERATION,
  MOMENT_SALT,
  POINTERS,
  SYMPATHY_MAX,
  STAMP_INTERVAL,
  TAP_COOLDOWN,
  TICKS_PER_MINUTE,
} from './config.ts';
import { createField, type FlowField } from './flow.ts';
import { CELL_COUNT } from './map.ts';
import { seedRng } from './rng.ts';
import {
  type Character,
  EndReason,
  EventKind,
  MOMENT_CARDS,
  MomentKind,
  NO_ANSWER,
  type Side,
} from './kinds.ts';

export * from './kinds.ts';

export const EVENT_STRIDE = 4;
export const NO_BARRICADE = -1;
export const NOT_SCHEDULED = -1;

export const RoachMode = { Walking: 0, Piled: 1, Climbing: 2 } as const;
export type RoachMode = (typeof RoachMode)[keyof typeof RoachMode];

export interface Roaches {
  readonly x: Int32Array;
  readonly y: Int32Array;
  readonly px: Int32Array;
  readonly py: Int32Array;
  readonly id: Int32Array;
  readonly gen: Uint8Array;
  readonly alive: Uint8Array;
  readonly mode: Uint8Array;
  readonly heldBy: Int8Array;
  readonly immuneUntil: Int32Array;
  readonly frozenUntil: Int32Array;
  readonly role: Uint8Array;
  readonly strayTicks: Int32Array;
}

export interface Barricades {
  readonly lane: Int8Array;
  readonly y: Int32Array;
  readonly pile: Int32Array;
  readonly expiresAt: Int32Array;
}

export interface Stamp {
  x: number;
  y: number;
  landsAt: number;
  nextAt: number;
  calledOff: boolean;
  pinpointed: boolean;
  wide: boolean;
}

export interface Steering {
  readonly field: FlowField;
  readonly goal: Uint8Array;
  cell: number;
}

export interface Moment {
  kind: MomentKind;
  opensAt: number;
  closesAt: number;
  nextAt: number;
  readonly cards: Int16Array;
  answer: number;
  closed: number;
  won: number;
}

export interface Timers {
  sitInUntil: number;
  sitInReadyAt: number;
  nextBarricadeAt: number;
  powerReadyAt: number;
  freezeEndsAt: number;
  frozenCount: number;
  silencedUntil: number;
  lawnsPausedUntil: number;
  listenSince: number;
  roadCursor: number;
  lathiRefillAt: number;
  surgeUntil: number;
}

export interface RunSetup {
  readonly seed: number;
  readonly side: Side;
  readonly character: Character;
}

export interface State {
  readonly side: Side;
  readonly character: Character;
  readonly roaches: Roaches;
  readonly barricades: Barricades;
  readonly stamp: Stamp;
  readonly moment: Moment;
  readonly steering: Steering;
  readonly momentRng: Uint32Array;
  readonly timers: Timers;
  readonly free: Int32Array;
  readonly queue: Int32Array;
  readonly rng: Uint32Array;
  readonly lastTap: Int32Array;
  readonly scratch: Int32Array;
  readonly density: Int32Array;
  readonly events: Int32Array;
  freeCount: number;
  queued: number;
  eventCount: number;
  tick: number;
  active: number;
  nextId: number;
  control: number;
  sympathy: number;
  peakSympathy: number;
  lastSmashTick: number;
  lawnAccumulator: number;
  became: number;
  reached: number;
  smashes: number;
  lathis: number;
  endReason: EndReason;
  endTick: number;
}

const createRoaches = (): Roaches => ({
  x: new Int32Array(MAX_ACTIVE),
  y: new Int32Array(MAX_ACTIVE),
  px: new Int32Array(MAX_ACTIVE),
  py: new Int32Array(MAX_ACTIVE),
  id: new Int32Array(MAX_ACTIVE),
  gen: new Uint8Array(MAX_ACTIVE),
  alive: new Uint8Array(MAX_ACTIVE),
  mode: new Uint8Array(MAX_ACTIVE),
  heldBy: new Int8Array(MAX_ACTIVE).fill(NO_BARRICADE),
  immuneUntil: new Int32Array(MAX_ACTIVE),
  frozenUntil: new Int32Array(MAX_ACTIVE),
  role: new Uint8Array(MAX_ACTIVE),
  strayTicks: new Int32Array(MAX_ACTIVE),
});

const createMoment = (): Moment => ({
  kind: MomentKind.None,
  opensAt: 0,
  closesAt: 0,
  nextAt: FIRST_MOMENT_AT,
  cards: new Int16Array(MOMENT_CARDS),
  answer: NO_ANSWER,
  closed: 0,
  won: 0,
});

const createBarricades = (): Barricades => ({
  lane: new Int8Array(BARRICADE_SLOTS).fill(NO_BARRICADE),
  y: new Int32Array(BARRICADE_SLOTS),
  pile: new Int32Array(BARRICADE_SLOTS),
  expiresAt: new Int32Array(BARRICADE_SLOTS).fill(NOT_SCHEDULED),
});

const freeSlots = (): Int32Array =>
  Int32Array.from({ length: MAX_ACTIVE }, (_, i) => MAX_ACTIVE - 1 - i);

export const DENSITY_COLS = 9;
const DENSITY_ROWS = 20;

export const createState = (setup: RunSetup): State => ({
  side: setup.side,
  character: setup.character,
  roaches: createRoaches(),
  barricades: createBarricades(),
  stamp: {
    x: 0,
    y: 0,
    landsAt: NOT_SCHEDULED,
    nextAt: STAMP_INTERVAL,
    calledOff: false,
    pinpointed: false,
    wide: false,
  },
  moment: createMoment(),
  steering: { field: createField(), goal: new Uint8Array(CELL_COUNT), cell: NOT_SCHEDULED },
  momentRng: seedRng(setup.seed ^ MOMENT_SALT),
  timers: {
    sitInUntil: 0,
    sitInReadyAt: 0,
    nextBarricadeAt: AI_BARRICADE_INTERVAL,
    powerReadyAt: ACT_MINUTE * TICKS_PER_MINUTE,
    freezeEndsAt: NOT_SCHEDULED,
    frozenCount: 0,
    silencedUntil: 0,
    lawnsPausedUntil: 0,
    listenSince: NOT_SCHEDULED,
    roadCursor: 0,
    lathiRefillAt: NOT_SCHEDULED,
    surgeUntil: 0,
  },
  free: freeSlots(),
  queue: new Int32Array(MAX_GENERATION + 1),
  rng: seedRng(setup.seed),
  lastTap: new Int32Array(POINTERS).fill(-TAP_COOLDOWN),
  scratch: new Int32Array(MAX_ACTIVE),
  density: new Int32Array(DENSITY_COLS * DENSITY_ROWS),
  events: new Int32Array(EVENT_CAPACITY * EVENT_STRIDE),
  freeCount: MAX_ACTIVE,
  queued: 0,
  eventCount: 0,
  tick: 0,
  active: 0,
  nextId: 0,
  control: CONTROL_START,
  sympathy: 0,
  peakSympathy: 0,
  lastSmashTick: 0,
  lawnAccumulator: 0,
  became: 0,
  reached: 0,
  smashes: 0,
  lathis: LATHI_MAX,
  endReason: EndReason.None,
  endTick: 0,
});

export const swarmOf = (state: State): number => state.active + state.queued;

export const modeOf = (state: State, slot: number): RoachMode =>
  (state.roaches.mode[slot] ?? RoachMode.Walking) as RoachMode;

export const sitInActive = (state: State): boolean => state.tick < state.timers.sitInUntil;

export const silenced = (state: State): boolean => state.tick < state.timers.silencedUntil;

export const lawnsPaused = (state: State): boolean => state.tick < state.timers.lawnsPausedUntil;

export const surging = (state: State): boolean => state.tick < state.timers.surgeUntil;

export const addSympathy = (state: State, amount: number): void => {
  state.sympathy = Math.max(0, Math.min(SYMPATHY_MAX, state.sympathy + amount));
  state.peakSympathy = Math.max(state.peakSympathy, state.sympathy);
};

export const surge = (state: State, ticks: number): void => {
  if (ticks === 0) return;
  const { timers } = state;
  timers.surgeUntil = Math.max(timers.surgeUntil, state.tick) + ticks;
  emit(state, EventKind.Surge, 0, 0, ticks);
};

export const emit = (state: State, kind: EventKind, x: number, y: number, value: number): void => {
  if (state.eventCount >= EVENT_CAPACITY) return;
  const at = state.eventCount * EVENT_STRIDE;
  state.events[at] = kind;
  state.events[at + 1] = x;
  state.events[at + 2] = y;
  state.events[at + 3] = value;
  state.eventCount += 1;
};
