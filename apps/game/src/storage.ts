import { Character } from '@suc/sim';

const KEYS = {
  character: 'suc.character',
  seenOverrun: 'suc.seenOverrun',
  foundListen: 'suc.foundListen',
  muted: 'suc.muted',
  noVibration: 'suc.noVibration',
} as const;

type Flag = Exclude<keyof typeof KEYS, 'character'>;

const read = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
};

const AGENCY_CHARACTERS: readonly Character[] = [
  Character.PrimeTime,
  Character.Chanakya,
  Character.PradhanSevak,
];

export const lastCharacter = (): Character =>
  AGENCY_CHARACTERS.find((character) => String(character) === read(KEYS.character)) ??
  Character.Chanakya;

export const rememberCharacter = (character: Character): void => {
  write(KEYS.character, String(character));
};

export const flag = (name: Flag): boolean => read(KEYS[name]) === '1';

export const setFlag = (name: Flag, value: boolean): void => {
  write(KEYS[name], value ? '1' : '0');
};

export const raiseFlag = (name: Flag): void => {
  setFlag(name, true);
};
