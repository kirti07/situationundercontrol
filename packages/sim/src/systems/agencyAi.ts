import {
  AI_BARRICADE_INTERVAL,
  AI_BARRICADE_MAX,
  BARRICADE_Y_MAX,
  BARRICADE_Y_MIN,
  CELL,
  STAMP_INTERVAL,
  PINPOINT_RADIUS,
  STAMP_RADIUS,
  STAMP_SYMPATHY,
  STAMP_WARNING,
  SUB,
} from '../config.ts';
import { barricadeCount, raiseBarricade } from '../barricades.ts';
import { clusterCenterX, clusterCenterY, densestCluster, NO_CLUSTER } from '../density.ts';
import { LANE_COUNT } from '../map.ts';
import { nextInt, nextRange } from '../rng.ts';
import { emit, EventKind, NOT_SCHEDULED, Side, sitInActive, type State } from '../state.ts';
import { smashWithin } from './hits.ts';

const squared = (units: number): number => units * SUB * (units * SUB);
const STAMP_SQUARED = squared(STAMP_RADIUS);
const PINPOINT_SQUARED = squared(PINPOINT_RADIUS);

const strikeAt = (x: number, y: number, wide: boolean) =>
  ({
    x,
    y,
    radiusSquared: wide ? PINPOINT_SQUARED : STAMP_SQUARED,
    sympathy: STAMP_SYMPATHY,
  }) as const;

const aimStamp = (state: State): void => {
  const { stamp } = state;
  if (state.tick < stamp.nextAt) return;
  stamp.nextAt += STAMP_INTERVAL;
  const cluster = densestCluster(state);
  if (stamp.calledOff || cluster === NO_CLUSTER) {
    stamp.calledOff = false;
    return;
  }
  stamp.x = clusterCenterX(cluster);
  stamp.y = clusterCenterY(cluster);
  stamp.landsAt = state.tick + STAMP_WARNING;
  stamp.wide = stamp.pinpointed;
  stamp.pinpointed = false;
  emit(state, EventKind.StampWarn, stamp.x, stamp.y, STAMP_WARNING);
  if (stamp.wide) emit(state, EventKind.Pinpointed, stamp.x, stamp.y, PINPOINT_RADIUS);
};

const landStamp = (state: State): void => {
  const { stamp } = state;
  if (state.tick !== stamp.landsAt) return;
  stamp.landsAt = NOT_SCHEDULED;
  if (sitInActive(state)) {
    emit(state, EventKind.Bounce, stamp.x, stamp.y, 0);
    return;
  }
  const hits = smashWithin(state, strikeAt(stamp.x, stamp.y, stamp.wide));
  stamp.wide = false;
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
