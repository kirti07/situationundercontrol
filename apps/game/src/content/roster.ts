import { Character, Side } from '@suc/sim';

export interface CharacterInfo {
  readonly name: string;
  readonly power: string;
}

export const CHARACTERS: Readonly<Record<Character, CharacterInfo>> = {
  [Character.None]: { name: 'The Swarm', power: 'Sit-in' },
  [Character.PrimeTime]: { name: 'Prime Time', power: 'The Nation Demands' },
  [Character.Chanakya]: { name: 'Chanakya', power: 'Masterstroke' },
  [Character.PradhanSevak]: { name: 'Pradhan Sevak', power: 'Mann Ki Baat' },
};

export const SIDE_NAMES: Readonly<Record<Side, string>> = {
  [Side.Agency]: 'Agency',
  [Side.Cockroach]: 'Cockroaches',
};
