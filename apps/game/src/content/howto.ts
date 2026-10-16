import { Side } from '@suc/sim';
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
      'Every smash raises Public Sympathy, and sympathy brings the lawns into the march.',
      'Your Power unlocks at 6 PM. Hold the line as long as you can.',
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
      'Hold and drag: the swarm walks toward your finger. Let go and it marches up the lanes.',
      'Canals cross only at the bridges and the metro. Barricades fall when 25 of you pile up.',
      'Sit-in at the right moment and the stamps hit nobody. Reach the arch by 9 PM.',
    ],
    keys: [
      ['Drag', 'Rally'],
      ['Space', 'Sit-in'],
      ['P', 'Pause'],
    ],
  },
};

export const SIDES_IN_ORDER: readonly Side[] = [Side.Agency, Side.Cockroach];
