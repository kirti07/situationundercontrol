import {
  createRun,
  isOver,
  step,
  type Input,
  type InputKind,
  type RunSetup,
  type State,
} from '@suc/sim';

export interface Session {
  readonly setup: RunSetup;
  readonly edition: number;
  readonly state: State;
  readonly log: Input[];
  readonly pending: Input[];
}

export const createSession = (setup: RunSetup, edition: number): Session => ({
  setup,
  edition,
  state: createRun(setup),
  log: [],
  pending: [],
});

export const queueInput = (
  session: Session,
  kind: InputKind,
  pointer: number,
  x: number,
  y: number,
): void => {
  session.pending.push({ tick: 0, kind, pointer, x, y });
};

export const advanceSession = (session: Session): boolean => {
  const tick = session.state.tick;
  const stamped = session.pending.map((input) => ({ ...input, tick }));
  session.pending.length = 0;
  session.log.push(...stamped);
  step(session.state, stamped);
  return !isOver(session.state);
};
