import { CLIMB_THRESHOLD, LATHI_MAX, Side } from '@suc/sim';
import type { IconName } from '../ui/icons.ts';

export interface HowTo {
  readonly icon: IconName;
  readonly title: string;
  readonly lines: readonly string[];
  readonly keys: readonly (readonly [string, string])[];
}

export const HOW_TO: Readonly<Record<Side, HowTo>> = {
  [Side.Agency]: {
    icon: 'stamp',
    title: 'Join the Agency',
    lines: [
      'Tap a cockroach to smash it. It comes back as three, a little faster, at the metro.',
      'Every smash raises Public Sympathy, three times as much on camera (the lawns and the metro), and sympathy brings the lawns into the march.',
      `You carry ${String(LATHI_MAX)} lathis; each tap spends one and they refill fast. Power unlocks at 6 PM.`,
    ],
    keys: [
      ['Click', 'Smash'],
      ['Space', 'Power'],
      ['P', 'Pause'],
    ],
  },
  [Side.Cockroach]: {
    icon: 'roach',
    title: 'Be the Cockroaches',
    lines: [
      'Hold and drag: roaches near your finger follow at full pace, and faster up close. Let go and they dawdle.',
      `Canals cross only at the bridges and the metro. Pile ${String(CLIMB_THRESHOLD)} on a barricade and you climb over.`,
      'Now and then a moment pops up: tap the fake protester or raise the right placard. Each win is a surge.',
    ],
    keys: [
      ['Drag', 'Lead'],
      ['1–2', 'Answer'],
      ['Space', 'Sit-in'],
      ['P', 'Pause'],
    ],
  },
};

export const SIDES_IN_ORDER: readonly Side[] = [Side.Agency, Side.Cockroach];
