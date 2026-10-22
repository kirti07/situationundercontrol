import type { Side } from '../content/roles.ts';

export const SIDES: readonly Side[] = ['cockroach', 'agency'];
export const WINDOW_MINUTES = 5;
const MAX_SAMPLE = 16384;
const MAX_BEAT_BYTES = 64;
const MAX_RISE = 3;

export interface Live {
  readonly on: boolean;
  readonly cockroach: number;
  readonly agency: number;
  readonly k: number;
}

export interface Beat {
  readonly side: Side;
  readonly k: number;
}

export interface Limits {
  readonly beatsPerMinute: number;
  readonly counterOn: boolean;
}

const DEFAULT_LIMITS: Limits = { beatsPerMinute: 15, counterOn: true };

const isPowerOfTwo = (value: number): boolean =>
  Number.isInteger(value) && value >= 1 && value <= MAX_SAMPLE && (value & (value - 1)) === 0;

const isSide = (value: unknown): value is Side => SIDES.includes(value as Side);

export const sampleFor = (players: number, beatsPerMinute: number): number => {
  let k = 1;
  while (k < MAX_SAMPLE && players / k > beatsPerMinute) k *= 2;
  return k;
};

export const withinStep = (k: number, server: number): boolean =>
  isPowerOfTwo(k) && k >= server / 2 && k <= server * 2;

const beatFrom = (value: unknown): Beat | undefined => {
  if (typeof value !== 'object' || value === null) return undefined;
  const { side, k, ...rest } = value as Record<string, unknown>;
  const valid = Object.keys(rest).length === 0 && isSide(side) && typeof k === 'number';
  return valid && isPowerOfTwo(k) ? { side, k } : undefined;
};

export const parseBeat = (body: string): Beat | undefined => {
  if (body.length > MAX_BEAT_BYTES) return undefined;
  try {
    return beatFrom(JSON.parse(body));
  } catch {
    return undefined;
  }
};

export const minuteKey = (time: number): string =>
  new Date(time).toISOString().slice(0, 16).replace(/[-T:]/g, '');

export const liveKey = (side: Side, minute: string): string => `live:${side}:${minute}`;

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

export const smooth = (minutes: readonly number[]): number => {
  const cap = median(minutes) * MAX_RISE;
  const total = minutes.reduce((sum, value) => sum + Math.min(value, cap), 0);
  return Math.round(total / Math.max(1, minutes.length));
};

const twoFigures = (value: number): number => {
  if (value < 100) return value;
  const scale = 10 ** (Math.floor(Math.log10(value)) - 1);
  return Math.round(value / scale) * scale;
};

export const displayCount = (value: number, k: number): string =>
  k === 1 ? value.toLocaleString('en-IN') : `~${twoFigures(value).toLocaleString('en-IN')}`;

export const parseLive = (value: unknown): Live | undefined => {
  if (typeof value !== 'object' || value === null) return undefined;
  const live = value as Partial<Live>;
  const counts = [live.cockroach, live.agency, live.k];
  if (typeof live.on !== 'boolean' || !counts.every((n) => typeof n === 'number' && n >= 0)) {
    return undefined;
  }
  return live as Live;
};

export const parseLimits = (value: unknown): Limits => {
  if (typeof value !== 'object' || value === null) return DEFAULT_LIMITS;
  const limits = value as Partial<Limits>;
  return {
    beatsPerMinute:
      typeof limits.beatsPerMinute === 'number' && limits.beatsPerMinute > 0
        ? limits.beatsPerMinute
        : DEFAULT_LIMITS.beatsPerMinute,
    counterOn: limits.counterOn !== false,
  };
};
