import {
  CONTROL_START,
  EVENT_CAPACITY,
  MAX_ACTIVE,
  MAX_GENERATION,
  POINTERS,
  TAP_COOLDOWN,
} from './config.ts';
import { seedRng } from './rng.ts';

export const Side = { Agency: 0, Cockroach: 1 } as const;
export type Side = (typeof Side)[keyof typeof Side];

export const Character = { None: 0, PrimeTime: 1, Chanakya: 2, PradhanSevak: 3 } as const;
export type Character = (typeof Character)[keyof typeof Character];

export const EndReason = {
  None: 0,
  Overrun: 1,
  Held: 2,
  Listened: 3,
  ReachedGate: 4,
  NextExam: 5,
} as const;
export type EndReason = (typeof EndReason)[keyof typeof EndReason];

export const EventKind = { Tap: 1, Smash: 2, Enter: 3 } as const;
export type EventKind = (typeof EventKind)[keyof typeof EventKind];

export const EVENT_STRIDE = 4;

export interface Roaches {
  readonly x: Int32Array;
  readonly y: Int32Array;
  readonly px: Int32Array;
  readonly py: Int32Array;
  readonly id: Int32Array;
  readonly gen: Uint8Array;
  readonly lane: Uint8Array;
  readonly alive: Uint8Array;
  readonly immuneUntil: Int32Array;
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
  readonly free: Int32Array;
  readonly queue: Int32Array;
  readonly rng: Uint32Array;
  readonly lastTap: Int32Array;
  readonly scratch: Int32Array;
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
  lane: new Uint8Array(MAX_ACTIVE),
  alive: new Uint8Array(MAX_ACTIVE),
  immuneUntil: new Int32Array(MAX_ACTIVE),
});

const freeSlots = (): Int32Array =>
  Int32Array.from({ length: MAX_ACTIVE }, (_, i) => MAX_ACTIVE - 1 - i);

export const createState = (setup: RunSetup): State => ({
  side: setup.side,
  character: setup.character,
  roaches: createRoaches(),
  free: freeSlots(),
  queue: new Int32Array(MAX_GENERATION + 1),
  rng: seedRng(setup.seed),
  lastTap: new Int32Array(POINTERS).fill(-TAP_COOLDOWN),
  scratch: new Int32Array(MAX_ACTIVE),
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
  endReason: EndReason.None,
  endTick: 0,
});

export const swarmOf = (state: State): number => state.active + state.queued;

export const emit = (state: State, kind: EventKind, x: number, y: number, value: number): void => {
  if (state.eventCount >= EVENT_CAPACITY) return;
  const at = state.eventCount * EVENT_STRIDE;
  state.events[at] = kind;
  state.events[at + 1] = x;
  state.events[at + 2] = y;
  state.events[at + 3] = value;
  state.eventCount += 1;
};
