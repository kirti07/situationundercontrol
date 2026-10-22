import type { Side } from './content/roles.ts';

interface Saved {
  readonly muted: boolean;
  readonly best: Readonly<Record<Side, number>>;
}

const KEY = 'suc:v1';
const DEFAULTS: Saved = { muted: false, best: { cockroach: 0, agency: 0 } };

const isSaved = (value: unknown): value is Saved =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Saved).muted === 'boolean' &&
  typeof (value as Saved).best === 'object';

export const load = (): Saved => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return isSaved(value)
      ? { ...DEFAULTS, ...value, best: { ...DEFAULTS.best, ...value.best } }
      : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
};

const save = (saved: Saved): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    return;
  }
};

export const setMuted = (muted: boolean): void => {
  save({ ...load(), muted });
};

export const recordScore = (side: Side, score: number): boolean => {
  const saved = load();
  if (score <= saved.best[side]) return false;
  save({ ...saved, best: { ...saved.best, [side]: score } });
  return true;
};
