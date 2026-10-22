import { FLOATY_MAX_FALL, PLAYER } from './tuning.ts';

export type Side = 'cockroach' | 'agency';
export type CharacterId = 'media' | 'publicServant' | 'police';
export type Item = 'flag' | 'money' | 'roach' | 'story';
export type Look = 'roach' | 'media' | 'servant' | 'police';

export interface Mods {
  readonly maxFall: number;
  readonly energy: boolean;
}

export interface Role {
  readonly side: Side;
  readonly name: string;
  readonly look: Look;
  readonly item: Item;
  readonly exit: 'gate' | 'stage';
  readonly collects: string;
  readonly goal: string;
  readonly exitOpen: string;
  readonly clearLine: string;
  readonly itemsName: string;
  readonly exitLine: string;
  readonly mods: Mods;
}

const PLAIN: Mods = { maxFall: PLAYER.maxFall, energy: false };

const AGENCY = {
  side: 'agency',
  exit: 'stage',
  exitOpen: 'TO THE PHOTO-OP!',
  exitLine: 'Made the photo-op',
} as const;

export const COCKROACH: Role = {
  side: 'cockroach',
  name: 'The Aspirant',
  look: 'roach',
  item: 'flag',
  exit: 'gate',
  collects: 'FLAGS',
  goal: 'COLLECT THE FLAGS',
  exitOpen: 'GO THRU THE GATE!',
  clearLine: 'flags flew tonight.',
  itemsName: 'Flags',
  exitLine: 'Reached the gate',
  mods: PLAIN,
};

export const CHARACTERS: Readonly<Record<CharacterId, Role>> = {
  media: {
    ...AGENCY,
    name: 'Media',
    look: 'media',
    item: 'story',
    collects: 'STORIES',
    goal: 'RUN THE TRIVIAL STORIES',
    clearLine: 'trivial stories ran tonight.',
    itemsName: 'Stories',
    mods: PLAIN,
  },
  publicServant: {
    ...AGENCY,
    name: 'Public Servant',
    look: 'servant',
    item: 'money',
    collects: 'PM CARES ₹',
    goal: 'COLLECT FOR THE PM CARES FUND',
    clearLine: 'bundles in the PM Cares box.',
    itemsName: 'Bundles',
    mods: { ...PLAIN, maxFall: FLOATY_MAX_FALL },
  },
  police: {
    ...AGENCY,
    name: 'Police',
    look: 'police',
    item: 'roach',
    collects: 'DETAINED',
    goal: 'ROUND UP THE COCKROACHES',
    clearLine: 'cockroaches detained.',
    itemsName: 'Detained',
    mods: { ...PLAIN, energy: true },
  },
};

export interface Ending {
  readonly headline: string;
  readonly caption: string;
}

export const ENDINGS: Readonly<Record<Side, { readonly won: Ending; readonly lost: Ending }>> = {
  cockroach: {
    won: {
      headline: 'SITUATION OUT OF CONTROL',
      caption: 'Flags flew over India Gate tonight.',
    },
    lost: {
      headline: 'SITUATION UNDER CONTROL',
      caption: 'Officials confirmed there were no flags.',
    },
  },
  agency: {
    won: {
      headline: 'SITUATION UNDER CONTROL',
      caption: 'All issues resolved, said a press release.',
    },
    lost: {
      headline: 'SITUATION OUT OF CONTROL',
      caption: 'The burning issues were, briefly, discussed.',
    },
  },
};

export const roleOf = (side: Side, character: CharacterId = 'media'): Role =>
  side === 'cockroach' ? COCKROACH : CHARACTERS[character];
