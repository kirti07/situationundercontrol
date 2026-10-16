import {
  LAWN_THRESHOLD,
  MARCH,
  METRO_GROWTH_MINUTES,
  METRO_INTERVAL,
  PHASE_BY_MINUTE,
  QUEUE_DRAIN_INTERVAL,
  TICKS_PER_MINUTE,
  type Phase,
} from '../config.ts';
import { LANES, LAWN_LANES, LAWN_Y_MAX, LAWN_Y_MIN, ROADS } from '../map.ts';
import { nextInt, nextRange } from '../rng.ts';
import { drainOne, spawnAt, spawnAtMetro } from '../roaches.ts';
import { silenced, type State } from '../state.ts';

const spawnMetro = (state: State, phase: Phase, minute: number): void => {
  if (state.tick % METRO_INTERVAL !== 0) return;
  const batch = 1 + phase.metroGrowth * Math.floor(minute / METRO_GROWTH_MINUTES);
  for (let i = 0; i < batch; i += 1) {
    spawnAtMetro(state, 0, state.tick);
  }
};

const spawnRoads = (state: State, phase: Phase): void => {
  const sincePhase = state.tick - phase.fromMinute * TICKS_PER_MINUTE;
  if (phase.roadInterval === 0 || sincePhase % phase.roadInterval !== 0) return;
  for (const road of ROADS) {
    spawnAt(state, road.x, road.y);
  }
};

const spawnLawns = (state: State): void => {
  if (silenced(state)) return;
  state.lawnAccumulator += state.sympathy;
  if (state.lawnAccumulator < LAWN_THRESHOLD) return;
  state.lawnAccumulator -= LAWN_THRESHOLD;
  const lane = LANES[LAWN_LANES[nextInt(state.rng, LAWN_LANES.length)] ?? 0];
  const jitter = lane?.jitter ?? 0;
  const x = (lane?.centerX ?? 0) + nextRange(state.rng, -jitter, jitter);
  const y = nextRange(state.rng, LAWN_Y_MIN, LAWN_Y_MAX);
  spawnAt(state, x, y);
};

const drainQueue = (state: State): void => {
  const due = state.tick % QUEUE_DRAIN_INTERVAL === 0;
  if (due && state.queued > 0 && state.freeCount > 0) drainOne(state);
};

export const spawnSystem = (state: State): void => {
  const minute = Math.floor(state.tick / TICKS_PER_MINUTE);
  const phase = PHASE_BY_MINUTE[minute] ?? MARCH;
  drainQueue(state);
  spawnMetro(state, phase, minute);
  spawnRoads(state, phase);
  spawnLawns(state);
};
