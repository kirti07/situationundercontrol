import {
  Character,
  createRun,
  InputKind,
  MAX_ACTIVE,
  Side,
  step,
  type Input,
  type RunSetup,
  type State,
} from '../src/index.ts';

export const AGENCY: RunSetup = { seed: 42, side: Side.Agency, character: Character.Chanakya };
export const COCKROACH: RunSetup = { seed: 42, side: Side.Cockroach, character: Character.None };

export const agencyRun = (): State => createRun(AGENCY);

export const advance = (state: State, ticks: number): void => {
  for (let i = 0; i < ticks; i += 1) step(state, []);
};

export const aliveSlots = (state: State): number[] =>
  Array.from({ length: MAX_ACTIVE }, (_, slot) => slot).filter(
    (slot) => state.roaches.alive[slot] === 1,
  );

export const worldOf = (state: State, slot: number): { x: number; y: number } => ({
  x: (state.roaches.x[slot] ?? 0) >> 8,
  y: (state.roaches.y[slot] ?? 0) >> 8,
});

export const tapInput = (state: State, x: number, y: number, pointer = 0): Input => ({
  tick: state.tick,
  kind: InputKind.Tap,
  pointer,
  x,
  y,
});

export const tapSlot = (state: State, slot: number, pointer = 0): void => {
  const { x, y } = worldOf(state, slot);
  step(state, [tapInput(state, x, y, pointer)]);
};

export const firstSmashable = (state: State): number => {
  const slot = aliveSlots(state).find(
    (candidate) => (state.roaches.immuneUntil[candidate] ?? 0) <= state.tick,
  );
  if (slot === undefined) throw new Error('no smashable roach');
  return slot;
};
