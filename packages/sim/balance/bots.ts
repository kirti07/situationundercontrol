import { clusterCenterX, clusterCenterY, densestCluster, NO_CLUSTER } from '../src/density.ts';
import { ARCH } from '../src/map.ts';
import {
  Character,
  InputKind,
  MAX_ACTIVE,
  MomentKind,
  Side,
  STAMP_WARNING,
  SUB,
  TAP_COOLDOWN,
  type Input,
  type State,
} from '../src/index.ts';

export type Bot = (state: State) => readonly Input[];

export interface BotSpec {
  readonly side: Side;
  readonly character: Character;
  readonly play: Bot;
}

const NONE: readonly Input[] = [];
const RESTRAINT_REACH = 120;
const RESTRAINT_LINE = (ARCH.y + ARCH.h + RESTRAINT_REACH) * SUB;
const POWER_EVERY = 60;
const HUMAN_TAP_EVERY = 20;

const command = (state: State, kind: InputKind, x = 0, y = 0): Input => ({
  tick: state.tick,
  kind,
  pointer: 0,
  x,
  y,
});

const onBeat = (state: State, every: number): boolean => state.tick % every === 0;

const frontRunner = (state: State): number => {
  const { roaches } = state;
  let best = -1;
  let bestY = RESTRAINT_LINE;
  for (let slot = 0; slot < MAX_ACTIVE; slot += 1) {
    const y = roaches.y[slot] ?? 0;
    const closer = roaches.alive[slot] === 1 && y < bestY;
    best = closer ? slot : best;
    bestY = closer ? y : bestY;
  }
  return best;
};

const idle: Bot = () => NONE;

const spam: Bot = (state) => {
  if (!onBeat(state, TAP_COOLDOWN)) return NONE;
  const cluster = densestCluster(state);
  if (cluster === NO_CLUSTER) return NONE;
  const x = clusterCenterX(cluster) / SUB;
  const y = clusterCenterY(cluster) / SUB;
  return [command(state, InputKind.Tap, x, y)];
};

const restraint =
  (every: number): Bot =>
  (state) => {
    if (!onBeat(state, every)) return NONE;
    const slot = frontRunner(state);
    if (slot === -1) return NONE;
    const x = Math.floor((state.roaches.x[slot] ?? 0) / SUB);
    const y = Math.floor((state.roaches.y[slot] ?? 0) / SUB);
    return [command(state, InputKind.Tap, x, y)];
  };

const lull = (state: State): boolean => onBeat(state, POWER_EVERY) && frontRunner(state) === -1;

const withPower =
  (bot: Bot): Bot =>
  (state) =>
    lull(state) ? [...bot(state), command(state, InputKind.Power)] : bot(state);

const REACTION = 60;
const ANSWERED_OF_TEN = 7;
const LEAD_EVERY = 15;
const SWEEP_TICKS = 15 * 60;
const SWEEP_FROM = 600;
const ARCH_X = ARCH.x + ARCH.w / 2;
const ARCH_Y = ARCH.y + ARCH.h / 2;

const reacted = (state: State): boolean => state.tick >= state.moment.opensAt + REACTION;

const accuseFake: Bot = (state) => {
  const slot = state.moment.cards[1] ?? 0;
  if (!reacted(state)) return NONE;
  const x = Math.floor((state.roaches.x[slot] ?? 0) / SUB);
  const y = Math.floor((state.roaches.y[slot] ?? 0) / SUB);
  return [command(state, InputKind.Tap, x, y)];
};

const raisePlacard: Bot = (state) =>
  reacted(state) ? [command(state, InputKind.Answer, state.moment.cards[1] ?? 0)] : NONE;

const MOMENT_PLAY: Readonly<Record<MomentKind, Bot>> = {
  [MomentKind.None]: idle,
  [MomentKind.Fake]: accuseFake,
  [MomentKind.Placard]: raisePlacard,
};

const lead: Bot = (state) => {
  if (!onBeat(state, LEAD_EVERY)) return NONE;
  const progress = (state.tick % SWEEP_TICKS) / SWEEP_TICKS;
  const y = Math.round(SWEEP_FROM - (SWEEP_FROM - ARCH_Y) * progress);
  return [command(state, InputKind.Steer, ARCH_X, y)];
};

const stampWarned = (state: State): boolean =>
  state.stamp.landsAt === state.tick + STAMP_WARNING - 1;

interface Player {
  readonly leads: boolean;
  readonly answeredOfTen: number;
  readonly sitsIn: boolean;
}

const cockroachPlayer =
  (player: Player): Bot =>
  (state) => [
    ...(player.leads ? lead(state) : NONE),
    ...(state.moment.closed % 10 < player.answeredOfTen
      ? MOMENT_PLAY[state.moment.kind](state)
      : NONE),
    ...(player.sitsIn && stampWarned(state) ? [command(state, InputKind.SitIn)] : NONE),
  ];

const agency = (character: Character, play: Bot): BotSpec => ({
  side: Side.Agency,
  character,
  play,
});

const cockroach = (play: Bot): BotSpec => ({
  side: Side.Cockroach,
  character: Character.None,
  play,
});

export const BOTS = {
  'agency idle': agency(Character.Chanakya, idle),
  'agency spam': agency(Character.Chanakya, spam),
  'agency restraint (perfect)': agency(Character.Chanakya, restraint(TAP_COOLDOWN)),
  'agency restraint': agency(Character.Chanakya, restraint(HUMAN_TAP_EVERY)),
  'restraint + Nation Demands': agency(Character.PrimeTime, withPower(restraint(HUMAN_TAP_EVERY))),
  'restraint + Masterstroke': agency(Character.Chanakya, withPower(restraint(HUMAN_TAP_EVERY))),
  'restraint + Mann Ki Baat': agency(Character.PradhanSevak, withPower(restraint(HUMAN_TAP_EVERY))),
  'cockroach idle': cockroach(idle),
  'cockroach leads only': cockroach(
    cockroachPlayer({ leads: true, answeredOfTen: 0, sitsIn: false }),
  ),
  'cockroach leads + 70% of moments': cockroach(
    cockroachPlayer({ leads: true, answeredOfTen: ANSWERED_OF_TEN, sitsIn: false }),
  ),
  'cockroach leads + every moment + sit-ins': cockroach(
    cockroachPlayer({ leads: true, answeredOfTen: 10, sitsIn: true }),
  ),
} as const satisfies Record<string, BotSpec>;

export type BotName = keyof typeof BOTS;
