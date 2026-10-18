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

export const EventKind = {
  Tap: 1,
  Smash: 2,
  Enter: 3,
  StampWarn: 4,
  StampLand: 5,
  Barricade: 6,
  Climb: 7,
  SitIn: 8,
  Power: 9,
  Backfire: 10,
  Muted: 11,
  Freeze: 12,
  Empty: 13,
  Filmed: 14,
  PerfectSitIn: 15,
  Bounce: 16,
  MomentOpen: 17,
  MomentResult: 19,
  Surge: 20,
  Caught: 21,
  WrongAccuse: 22,
  Pinpointed: 23,
} as const;
export type EventKind = (typeof EventKind)[keyof typeof EventKind];

export const MomentKind = { None: 0, Fake: 1, Placard: 2 } as const;
export type MomentKind = (typeof MomentKind)[keyof typeof MomentKind];

export const Outcome = { Ignored: 0, Won: 1, Lost: 2 } as const;
export type Outcome = (typeof Outcome)[keyof typeof Outcome];

export const Role = { Comrade: 0, Fake: 1 } as const;
export type Role = (typeof Role)[keyof typeof Role];

export const NO_ANSWER = -1;

const RESULT_STRIDE = 4;

export const momentResult = (kind: MomentKind, outcome: Outcome): number =>
  kind * RESULT_STRIDE + outcome;
export const MOMENT_CARDS = 4;
