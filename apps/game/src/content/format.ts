import { CLOCK_START_MINUTE, TICKS_PER_MINUTE } from '@suc/sim';

const MINUTES_PER_HOUR = 60;
const HOURS_ON_DIAL = 12;

export const clockLabel = (tick: number): string => {
  const minuteOfDay = CLOCK_START_MINUTE + Math.floor(tick / TICKS_PER_MINUTE);
  const hour = Math.floor(minuteOfDay / MINUTES_PER_HOUR) % HOURS_ON_DIAL || HOURS_ON_DIAL;
  const minute = String(minuteOfDay % MINUTES_PER_HOUR).padStart(2, '0');
  return `${String(hour)}:${minute} PM`;
};

export const countLabel = (value: number): string => value.toLocaleString('en-IN');
