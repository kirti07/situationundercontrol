import { editionFromUtcMs, editionSeed } from '@suc/sim';

export interface Edition {
  readonly number: number;
  readonly seed: number;
}

export const todaysEdition = (): Edition => {
  const number = editionFromUtcMs(Date.now());
  return { number, seed: editionSeed(number) };
};
