import {
  AI_BARRICADE_INTERVAL,
  AI_BARRICADE_MAX,
  BARRICADE_Y_MAX,
  BARRICADE_Y_MIN,
  CELL,
  STAMP_INTERVAL,
  STAMP_RADIUS,
  STAMP_WARNING,
  SUB,
} from '../config.ts';
import { barricadeCount, raiseBarricade } from '../barricades.ts';
import { clusterCenterX, clusterCenterY, densestCluster, NO_CLUSTER } from '../density.ts';
import { LANE_COUNT } from '../map.ts';
import { nextInt, nextRange } from '../rng.ts';
import { emit, EventKind, NOT_SCHEDULED, Side, sitInActive, type State } from '../state.ts';
import { smashWithin } from './hits.ts';

const STAMP_RADIUS_SQUARED = STAMP_RADIUS * SUB * (STAMP_RADIUS * SUB);

const aimStamp = (state: State): void => {
  const { stamp } = state;
  if (state.tick < stamp.nextAt) return;
  stamp.nextAt += STAMP_INTERVAL;
  const cluster = densestCluster(state);
  if (cluster === NO_CLUSTER) return;
  stamp.x = clusterCenterX(cluster);
  stamp.y = clusterCenterY(cluster);
  stamp.landsAt = state.tick + STAMP_WARNING;
  emit(state, EventKind.StampWarn, stamp.x, stamp.y, STAMP_WARNING);
};

const landStamp = (state: State): void => {
  const { stamp } = state;
  if (state.tick !== stamp.landsAt) return;
  stamp.landsAt = NOT_SCHEDULED;
  const hits = sitInActive(state) ? 0 : smashWithin(state, stamp.x, stamp.y, STAMP_RADIUS_SQUARED);
  emit(state, EventKind.StampLand, stamp.x, stamp.y, hits);
};

const placeBarricade = (state: State): void => {
  const { timers } = state;
  if (state.tick < timers.nextBarricadeAt) return;
  timers.nextBarricadeAt += AI_BARRICADE_INTERVAL;
  if (barricadeCount(state) >= AI_BARRICADE_MAX) return;
  const lane = nextInt(state.rng, LANE_COUNT);
  const row = nextRange(state.rng, BARRICADE_Y_MIN / CELL, BARRICADE_Y_MAX / CELL);
  raiseBarricade(state, lane, row * CELL);
};

export const agencyAiSystem = (state: State): void => {
  if (state.side !== Side.Cockroach) return;
  landStamp(state);
  aimStamp(state);
  placeBarricade(state);
};
