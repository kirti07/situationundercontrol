import { hashString } from './rng.ts';

export const EDITION_EPOCH = '2026-10-16';
export const MS_PER_DAY = 86400000;
export const IST_OFFSET_MS = 19800000;

const pad = (value: number, width: number): string => String(value).padStart(width, '0');

export const dateFromDays = (days: number): string => {
  const z = days + 719468;
  const era = Math.floor(z / 146097);
  const dayOfEra = z - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365,
  );
  const dayOfYear =
    dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const mp = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  const year = yearOfEra + era * 400 + (month <= 2 ? 1 : 0);
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
};

export const daysFromDate = (date: string): number => {
  const [year = 0, month = 0, day = 0] = date.split('-').map(Number);
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yearOfEra = y - era * 400;
  const dayOfYear = Math.floor((153 * (month > 2 ? month - 3 : month + 9) + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
};

const EPOCH_DAYS = daysFromDate(EDITION_EPOCH);

export const editionFromUtcMs = (utcMs: number): number =>
  Math.floor((utcMs + IST_OFFSET_MS) / MS_PER_DAY) - EPOCH_DAYS + 1;

export const editionDate = (edition: number): string => dateFromDays(EPOCH_DAYS + edition - 1);

export const editionSeed = (edition: number): number => hashString(`suc:${editionDate(edition)}`);
