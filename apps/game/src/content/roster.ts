import { Character, Side } from '@suc/sim';
import chanakyaArt from '../assets/art/chanakya.webp';
import pradhanSevakArt from '../assets/art/pradhan-sevak.webp';
import primeTimeArt from '../assets/art/prime-time.webp';

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
    effect: '4 s · untouchable',
    blurb: 'Everyone sits. Nobody can be stamped.',
    backfire: '',
    quote: '',
    art: '',
  },
  [Character.PrimeTime]: {
    name: 'Prime Time',
    office: 'The Anchor',
    power: 'The Nation Demands',
    effect: 'Freeze a crowd · 8 s',
    blurb: 'Brands the biggest crowd "anti-national". They freeze for 8 s.',
    backfire: 'The clip goes viral. +30% roaches from all six roads.',
    quote: '"The nation wants to know why these cockroaches won\'t let me finish my sentence!"',
    art: primeTimeArt,
  },
  [Character.Chanakya]: {
    name: 'Chanakya',
    office: 'The Home Office',
    power: 'Masterstroke',
    effect: 'Barricade every lane',
    blurb: 'Three barricades, one on every lane. All in one tap.',
    backfire: 'At 25 roaches the pile climbs over, faster than before.',
    quote: '"Masterstroke. We have barricaded the barricades."',
    art: chanakyaArt,
  },
  [Character.PradhanSevak]: {
    name: 'Pradhan Sevak',
    office: 'The Top Office',
    power: 'Mann Ki Baat',
    effect: 'Sympathy to zero · 20 s',
    blurb: 'A 20-second address to the nation. Every crowd on the lawns stops to listen.',
    backfire: "You can't smash while speaking. It wasn't about the roaches, so they keep walking.",
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
