export const FX = 16;
export const TILE = 16 * FX;
export const TICKS_PER_SECOND = 60;

export const VIEW = { cols: 20, rows: 11 } as const;

export const PLAYER = {
  width: 10 * FX,
  height: 14 * FX,
  runSpeed: 22,
  gravity: 3,
  jumpSpeed: 65,
  releasedRise: 24,
  maxFall: 96,
  coyoteTicks: 5,
  bufferTicks: 6,
} as const;

export const PATROL = {
  width: 12 * FX,
  height: 18 * FX,
  walkSpeed: 10,
  tiredSpeed: 5,
  energyMax: 600,
  tiredBelow: 200,
  sleepTicks: 3 * TICKS_PER_SECOND,
} as const;

export const BURN = {
  cycleTicks: 300,
  burnTicks: 90,
  smokeTicks: TICKS_PER_SECOND,
  reach: 4 * FX,
} as const;

export const ENERGY = {
  max: 1200,
  tiredBelow: 300,
  tiredRunSpeed: 15,
  tiredJumpSpeed: 58,
  dozeTicks: 2 * TICKS_PER_SECOND,
  wakeEnergy: 300,
  refill: 600,
} as const;

export const FLOATY_MAX_FALL = 64;

export const RULES = {
  lives: 3,
  caughtTicks: 45,
  pickupInset: 3 * FX,
} as const;

export const SCORE = {
  collect: 100,
  clear: 500,
  neverCaught: 1000,
  timeBonusPerSecond: 10,
  parSeconds: 90,
} as const;
