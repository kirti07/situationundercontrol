import { Side } from '@suc/sim';

export const SIDE_CLASS: Readonly<Record<Side, string>> = {
  [Side.Agency]: 'agency',
  [Side.Cockroach]: 'roach',
};
