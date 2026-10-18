import { MomentKind, Side, TICKS_PER_SECOND, type State } from '@suc/sim';
import { GAGS } from '../content/moments.ts';

const GAG_EVERY = 25 * TICKS_PER_SECOND;

export interface GagDirector {
  readonly observe: (state: State) => string | null;
}

const gagAt = (state: State, edition: number): string | null => {
  const due = state.tick > 0 && state.tick % GAG_EVERY === 0;
  if (!due || state.moment.kind !== MomentKind.None) return null;
  return GAGS[(state.tick / GAG_EVERY + edition) % GAGS.length] ?? null;
};

const SIDE_GAGS: Readonly<Record<Side, (edition: number) => GagDirector>> = {
  [Side.Agency]: () => ({ observe: () => null }),
  [Side.Cockroach]: (edition) => ({ observe: (state) => gagAt(state, edition) }),
};

export const createGagDirector = (side: Side, edition: number): GagDirector =>
  SIDE_GAGS[side](edition);
