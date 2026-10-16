import { Character, Side } from '@suc/sim';

export interface CharacterInfo {
  readonly name: string;
  readonly power: string;
  readonly effect: string;
}

export const CHARACTERS: Readonly<Record<Character, CharacterInfo>> = {
  [Character.None]: { name: 'The Swarm', power: 'Sit-in', effect: '4 s · untouchable' },
  [Character.PrimeTime]: {
    name: 'Prime Time',
    power: 'The Nation Demands',
    effect: 'Freeze the crowd · 8 s',
  },
  [Character.Chanakya]: {
    name: 'Chanakya',
    power: 'Masterstroke',
    effect: 'Barricade every lane',
  },
  [Character.PradhanSevak]: {
    name: 'Pradhan Sevak',
    power: 'Mann Ki Baat',
    effect: 'Sympathy to zero · 20 s',
  },
};

export const SIDE_NAMES: Readonly<Record<Side, string>> = {
  [Side.Agency]: 'Agency',
  [Side.Cockroach]: 'Cockroaches',
};
