import { CLOCK_START_MINUTE, editionDate, SYMPATHY_SCALE, TICKS_PER_MINUTE } from '@suc/sim';

const MINUTES_PER_HOUR = 60;
const HOURS_ON_DIAL = 12;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const ROMAN_VOLUME = 'I';

export const clockLabel = (tick: number): string => {
  const minuteOfDay = CLOCK_START_MINUTE + Math.floor(tick / TICKS_PER_MINUTE);
  const hour = Math.floor(minuteOfDay / MINUTES_PER_HOUR) % HOURS_ON_DIAL || HOURS_ON_DIAL;
  const minute = String(minuteOfDay % MINUTES_PER_HOUR).padStart(2, '0');
  return `${String(hour)}:${minute} PM`;
};

export const countLabel = (value: number): string => value.toLocaleString('en-IN');

export const percentLabel = (sympathy: number): string =>
  `${String(Math.floor(sympathy / SYMPATHY_SCALE))}%`;

export const editionDateline = (edition: number): string => {
  const [, month = '1', day = '1'] = editionDate(edition).split('-');
  return `New Delhi · ${String(Number(day))} ${MONTHS[Number(month) - 1] ?? ''}`;
};

export const editionNumber = (edition: number): string =>
  `Vol. ${ROMAN_VOLUME} · No. ${String(edition)}`;
