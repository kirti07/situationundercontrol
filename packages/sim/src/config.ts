export const SIM_VERSION = 2;

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
export const FIELD_RESERVE = 100;
export const QUEUE_DRAIN_INTERVAL = 3;
export const EVENT_CAPACITY = 512;

export const BASE_SPEED = 85;
export const MAX_SPEED = BASE_SPEED * 2;
export const HYDRA_CHILDREN = 3;
export const RESPAWN_IMMUNITY = 30;

export const POINTERS = 2;
export const TAP_RADIUS = 24;
export const TAP_COOLDOWN = 8;
export const LATHI_MAX = 6;
export const LATHI_REFILL = 20;

export const CONTROL_START = 100;

export const SYMPATHY_SCALE = 120;
export const SYMPATHY_MAX = 100 * SYMPATHY_SCALE;
export const SMASH_SYMPATHY = SYMPATHY_SCALE;
export const STAMP_SYMPATHY = 0;
export const ON_CAMERA_SYMPATHY = 3 * SYMPATHY_SCALE;
export const SYMPATHY_DECAY_DELAY = 3 * TICKS_PER_SECOND;
export const SYMPATHY_DECAY_PER_TICK = 1;
export const LAWN_THRESHOLD = 20 * TICKS_PER_SECOND * SYMPATHY_SCALE;

export const METRO_INTERVAL = TICKS_PER_SECOND;
export const METRO_GROWTH_MINUTES = 15;

export const ACT_MINUTE = 30;
export const LIGHTS_MINUTE = 90;
export const RUSH_MINUTE = 150;

export const COCKROACH_START_SWARM = 30;

export const POWER_CHARGE = 25 * TICKS_PER_SECOND;
export const FREEZE_RADIUS = 120;
export const FREEZE_DURATION = 8 * TICKS_PER_SECOND;
export const BACKFIRE_NUMERATOR = 3;
export const BACKFIRE_DENOMINATOR = 10;
export const MASTERSTROKE_Y = 360;
export const MASTERSTROKE_DURATION = 15 * TICKS_PER_SECOND;
export const SILENCE_DURATION = 4 * TICKS_PER_SECOND;
export const LAWN_PAUSE_DURATION = 20 * TICKS_PER_SECOND;
export const LISTEN_HOLD = TICKS_PER_SECOND;

export const MARCH_NUMERATOR = 2;
export const MARCH_DENOMINATOR = 7;
export const FOLLOW_RADIUS = 120;
export const STRAY_TICKS = 150;
export const CHANT_RADIUS = 80;
export const CHANT_NUMERATOR = 3;
export const CHANT_DENOMINATOR = 2;

export const SIT_IN_DURATION = 2 * TICKS_PER_SECOND;
export const SIT_IN_CHARGE = 15 * TICKS_PER_SECOND;
export const SIT_IN_SYMPATHY = 25 * SYMPATHY_SCALE;
export const PERFECT_SIT_IN_SYMPATHY = 2 * SIT_IN_SYMPATHY;
export const PERFECT_SIT_IN_JOINERS = 20;
export const PERFECT_SIT_IN_SURGE = SIT_IN_DURATION + 3 * TICKS_PER_SECOND;
export const JOINER_JITTER = 16;

export const STAMP_INTERVAL = 3 * TICKS_PER_SECOND;
export const STAMP_WARNING = 48;
export const STAMP_RADIUS = 40;
export const DENSITY_CELL = 40;

export const BARRICADE_SLOTS = 6;
export const AI_BARRICADE_INTERVAL = 30 * TICKS_PER_SECOND;
export const AI_BARRICADE_MAX = 3;
export const BARRICADE_Y_MIN = 312;
export const BARRICADE_Y_MAX = 576;
export const CLIMB_THRESHOLD = 15;
export const CLIMB_CLEARANCE = 24;
export const CLIMB_SPEED_NUMERATOR = 2;
export const CLIMB_SPEED_DENOMINATOR = 1;
export const REACHED_QUOTA = 1500;

export const MOMENT_SALT = 0x6d6f6d74;
export const FIRST_MOMENT_AT = 10 * TICKS_PER_SECOND;
export const MOMENT_GAP = 30 * TICKS_PER_SECOND;
export const RUSH_MOMENT_GAP = 25 * TICKS_PER_SECOND;
export const MOMENT_WINDOW = 4 * TICKS_PER_SECOND;
export const FIRST_MOMENT_WINDOW = 6 * TICKS_PER_SECOND;
export const FAKE_WINDOW = 5 * TICKS_PER_SECOND;
export const CAUGHT_SYMPATHY = 10 * SYMPATHY_SCALE;
export const ACCUSE_RADIUS = 20;
export const WRONG_ACCUSE_LEAVERS = 5;
export const LEAVER_RADIUS = 40;
export const PINPOINT_RADIUS = (STAMP_RADIUS * 3) / 2;
export const PLACARD_RIGHT_SYMPATHY = 15 * SYMPATHY_SCALE;
export const PLACARD_WRONG_SYMPATHY = -10 * SYMPATHY_SCALE;
export const PLACARD_JOINERS = 60;
export const PLACARD_SURGE = 6 * TICKS_PER_SECOND;
export const CAUGHT_SURGE = 6 * TICKS_PER_SECOND;
export const PLACARD_JOIN_Y = 300;
export const FAKE_TELLS = 6;
export const PLACARD_PAIRS = 20;

export interface Phase {
  readonly fromMinute: number;
  readonly metroGrowth: number;
  readonly roadInterval: number;
}

export const MARCH: Phase = { fromMinute: 0, metroGrowth: 0, roadInterval: 0 };

const PHASES: readonly Phase[] = [
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
