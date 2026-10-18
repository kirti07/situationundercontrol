import {
  BACKFIRE_DENOMINATOR,
  BACKFIRE_NUMERATOR,
  Character,
  CLIMB_THRESHOLD,
  FREEZE_DURATION,
  LAWN_PAUSE_DURATION,
  MASTERSTROKE_DURATION,
  Side,
  SILENCE_DURATION,
  SIT_IN_DURATION,
} from '@suc/sim';
import chanakyaArt from '../assets/art/chanakya.webp';
import pradhanSevakArt from '../assets/art/pradhan-sevak.webp';
import primeTimeArt from '../assets/art/prime-time.webp';
import { secondsLabel } from './format.ts';

const BACKFIRE_PERCENT = (BACKFIRE_NUMERATOR * 100) / BACKFIRE_DENOMINATOR;

export interface CharacterInfo {
  readonly name: string;
  readonly office: string;
  readonly power: string;
  readonly effect: string;
  readonly blurb: string;
  readonly backfire: string;
  readonly quote: string;
  readonly art: string;
}

export const AGENCY_ROSTER: readonly Character[] = [
  Character.PrimeTime,
  Character.Chanakya,
  Character.PradhanSevak,
];

export const CHARACTERS: Readonly<Record<Character, CharacterInfo>> = {
  [Character.None]: {
    name: 'The Swarm',
    office: 'Kartavya Path',
    power: 'Sit-in',
    effect: `${secondsLabel(SIT_IN_DURATION)} · untouchable`,
    blurb: 'Everyone sits. Nobody can be stamped.',
    backfire: '',
    quote: '',
    art: '',
  },
  [Character.PrimeTime]: {
    name: 'Prime Time',
    office: 'The Anchor',
    power: 'The Nation Demands',
    effect: `Freeze a crowd · ${secondsLabel(FREEZE_DURATION)}`,
    blurb: `Brands the biggest crowd "anti-national". They freeze for ${secondsLabel(FREEZE_DURATION)}.`,
    backfire: `The clip goes viral. +${String(BACKFIRE_PERCENT)}% roaches from all six roads.`,
    quote: '"The nation wants to know why these cockroaches won\'t let me finish my sentence!"',
    art: primeTimeArt,
  },
  [Character.Chanakya]: {
    name: 'Chanakya',
    office: 'The Home Office',
    power: 'Masterstroke',
    effect: `Every lane · ${secondsLabel(MASTERSTROKE_DURATION)}`,
    blurb: `Three barricades, one on every lane, for ${secondsLabel(MASTERSTROKE_DURATION)}. All in one tap.`,
    backfire: `At ${String(CLIMB_THRESHOLD)} roaches the pile climbs over, twice as fast.`,
    quote: '"Masterstroke. We have barricaded the barricades."',
    art: chanakyaArt,
  },
  [Character.PradhanSevak]: {
    name: 'Pradhan Sevak',
    office: 'The Top Office',
    power: 'Mann Ki Baat',
    effect: `Lawns quiet · ${secondsLabel(LAWN_PAUSE_DURATION)}`,
    blurb: `An address to the nation. Every crowd on the lawns stops to listen for ${secondsLabel(LAWN_PAUSE_DURATION)}.`,
    backfire: `No smashing for the first ${secondsLabel(SILENCE_DURATION)}. It wasn't about the roaches, so they keep walking.`,
    quote: '"Today, let us talk about millets."',
    art: pradhanSevakArt,
  },
};

export const SIDE_NAMES: Readonly<Record<Side, string>> = {
  [Side.Agency]: 'Agency',
  [Side.Cockroach]: 'Cockroaches',
};

export const DISCLAIMER =
  'All characters are satirical caricatures of public offices. The cockroaches are, unfortunately, real.';
