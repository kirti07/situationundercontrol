export const SIM_VERSION = 1;

export const SUB = 256;
export const TICKS_PER_SECOND = 60;
export const TICKS_PER_MINUTE = 60;
export const RUN_MINUTES = 210;
export const RUN_TICKS = RUN_MINUTES * TICKS_PER_MINUTE;
export const CLOCK_START_MINUTE = 17 * 60 + 30;

export const FIELD_WIDTH = 360;
export const FIELD_HEIGHT = 780;
export const CELL = 12;
export const GRID_COLS = FIELD_WIDTH / CELL;
export const GRID_ROWS = FIELD_HEIGHT / CELL;

export const MAX_ACTIVE = 400;
export const QUEUE_DRAIN_INTERVAL = 3;
export const EVENT_CAPACITY = 512;

export const BASE_SPEED = 85;
export const MAX_SPEED = BASE_SPEED * 2;
export const HYDRA_CHILDREN = 3;
export const RESPAWN_IMMUNITY = 30;

export const POINTERS = 2;
export const TAP_RADIUS = 24;
export const TAP_COOLDOWN = 8;

export const CONTROL_START = 100;

export const SYMPATHY_SCALE = 120;
export const SYMPATHY_MAX = 100 * SYMPATHY_SCALE;
export const SMASH_SYMPATHY = SYMPATHY_SCALE;
export const SYMPATHY_DECAY_DELAY = 3 * TICKS_PER_SECOND;
export const SYMPATHY_DECAY_PER_TICK = 1;
export const LAWN_THRESHOLD = 20 * TICKS_PER_SECOND * SYMPATHY_SCALE;

export const METRO_INTERVAL = 2 * TICKS_PER_SECOND;
export const METRO_GROWTH_MINUTES = 30;
export const METRO_JITTER = 36;

export const ACT_MINUTE = 30;
export const LIGHTS_MINUTE = 90;
export const RUSH_MINUTE = 150;

export const COCKROACH_START_SWARM = 30;
export const REACHED_QUOTA = 500;

export interface Phase {
  readonly fromMinute: number;
  readonly metroGrowth: number;
  readonly roadInterval: number;
}

export const MARCH: Phase = { fromMinute: 0, metroGrowth: 0, roadInterval: 0 };

export const PHASES: readonly Phase[] = [
  MARCH,
  { fromMinute: ACT_MINUTE, metroGrowth: 1, roadInterval: 0 },
  { fromMinute: LIGHTS_MINUTE, metroGrowth: 1, roadInterval: 4 * TICKS_PER_SECOND },
  { fromMinute: RUSH_MINUTE, metroGrowth: 1, roadInterval: 2 * TICKS_PER_SECOND },
];

const phaseAt = (minute: number): Phase =>
  PHASES.reduce((current, phase) => (minute >= phase.fromMinute ? phase : current), MARCH);

export const PHASE_BY_MINUTE: readonly Phase[] = Array.from({ length: RUN_MINUTES + 1 }, (_, m) =>
  phaseAt(m),
);

const speedTable = (): Int32Array => {
  let speed = BASE_SPEED;
  const speeds = [speed];
  while (speed < MAX_SPEED) {
    speed = Math.min(MAX_SPEED, Math.floor((speed * 11) / 10));
    speeds.push(speed);
  }
  return Int32Array.from(speeds);
};

export const SPEED_BY_GENERATION = speedTable();
export const MAX_GENERATION = SPEED_BY_GENERATION.length - 1;
