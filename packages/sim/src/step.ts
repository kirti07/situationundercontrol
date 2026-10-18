import { COCKROACH_START_SWARM } from './config.ts';
import { InputKind, type Input } from './input.ts';
import { spawnAtMetro } from './roaches.ts';
import { createState, EndReason, Side, type RunSetup, type State } from './state.ts';
import { agencyAiSystem } from './systems/agencyAi.ts';
import { archSystem } from './systems/arch.ts';
import { barricadeSystem } from './systems/barricade.ts';
import { clockSystem } from './systems/clock.ts';
import { answerMoment } from './systems/momentAnswers.ts';
import { momentsSystem } from './systems/moments.ts';
import { lathiSystem } from './systems/lathis.ts';
import { moveSystem } from './systems/move.ts';
import { listenDown, listenUp, powersSystem, usePower } from './systems/powers.ts';
import { resultSystem } from './systems/result.ts';
import { tap } from './systems/smash.ts';
import { spawnSystem } from './systems/spawn.ts';
import { sitIn, steerEnd, steerTo } from './systems/swarm.ts';
import { sympathySystem } from './systems/sympathy.ts';

type System = (state: State) => void;
type InputHandler = (state: State, input: Input) => void;

const INPUT_HANDLERS: Record<InputKind, InputHandler> = {
  [InputKind.Tap]: tap,
  [InputKind.SitIn]: sitIn,
  [InputKind.Power]: usePower,
  [InputKind.ListenDown]: listenDown,
  [InputKind.ListenUp]: listenUp,
  [InputKind.Answer]: answerMoment,
  [InputKind.Steer]: steerTo,
  [InputKind.SteerEnd]: steerEnd,
};

const SYSTEMS: readonly System[] = [
  spawnSystem,
  agencyAiSystem,
  momentsSystem,
  powersSystem,
  lathiSystem,
  moveSystem,
  barricadeSystem,
  archSystem,
  sympathySystem,
  clockSystem,
  resultSystem,
];

const SIDE_START: Record<Side, System> = {
  [Side.Agency]: () => undefined,
  [Side.Cockroach]: (state) => {
    for (let i = 0; i < COCKROACH_START_SWARM; i += 1) {
      spawnAtMetro(state, 0, 0);
    }
  },
};

export const createRun = (setup: RunSetup): State => {
  const state = createState(setup);
  SIDE_START[state.side](state);
  return state;
};

export const isOver = (state: State): boolean => state.endReason !== EndReason.None;

export const step = (state: State, inputs: readonly Input[]): void => {
  if (isOver(state)) return;
  state.eventCount = 0;
  for (const input of inputs) {
    INPUT_HANDLERS[input.kind](state, input);
  }
  for (const system of SYSTEMS) {
    system(state);
  }
};

export const replay = (setup: RunSetup, inputs: readonly Input[]): State => {
  const state = createRun(setup);
  const batch: Input[] = [];
  let cursor = 0;
  while (!isOver(state)) {
    batch.length = 0;
    let next = inputs[cursor];
    while (next?.tick === state.tick) {
      batch.push(next);
      cursor += 1;
      next = inputs[cursor];
    }
    step(state, batch);
  }
  return state;
};
