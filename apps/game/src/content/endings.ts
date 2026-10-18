import { EndReason, REACHED_QUOTA, type Side } from '@suc/sim';
import gateInk from '../assets/art/gate-ink.webp';
import gateTricolour from '../assets/art/gate-tricolour.webp';
import { clockLabel, countLabel, percentLabel } from './format.ts';

export interface RunSummary {
  readonly side: Side;
  readonly edition: number;
  readonly endReason: EndReason;
  readonly endTick: number;
  readonly control: number;
  readonly reached: number;
  readonly smashes: number;
  readonly became: number;
  readonly swarm: number;
  readonly peakSympathy: number;
  readonly momentsWon: number;
  readonly momentsClosed: number;
}

export interface Stat {
  readonly value: string;
  readonly label: string;
}

export const Theme = { Paper: 'paper', Night: 'night' } as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

export interface EndingCopy {
  readonly theme: Theme;
  readonly kicker: string;
  readonly headline: string;
  readonly dek: (run: RunSummary) => string;
  readonly quote: string;
  readonly art: string;
  readonly crowd: boolean;
  readonly stats: (run: RunSummary) => readonly Stat[];
  readonly share: (run: RunSummary) => string;
}

const agencyStats = (run: RunSummary): readonly Stat[] => [
  { value: countLabel(run.smashes), label: 'Smashes' },
  { value: countLabel(run.became), label: 'Became' },
  { value: percentLabel(run.peakSympathy), label: 'Sympathy' },
];

const swarmStats = (run: RunSummary): readonly Stat[] => [
  { value: countLabel(run.reached), label: 'Arrived' },
  { value: `${String(run.momentsWon)}/${String(run.momentsClosed)}`, label: 'Moments won' },
  { value: percentLabel(run.peakSympathy), label: 'Sympathy' },
];

const AGENCY_SHARE = (run: RunSummary): string =>
  `I held India Gate till ${clockLabel(run.endTick)}. Your turn.`;

const SWARM_SHARE = (run: RunSummary): string =>
  `${countLabel(run.reached)} of us reached India Gate. #MainBhiCockroach`;

export const ENDINGS: Readonly<Record<EndReason, EndingCopy>> = {
  [EndReason.None]: {
    theme: Theme.Paper,
    kicker: '',
    headline: '',
    dek: () => '',
    quote: '',
    art: gateInk,
    crowd: false,
    stats: () => [],
    share: () => '',
  },
  [EndReason.Overrun]: {
    theme: Theme.Paper,
    kicker: 'Agency run',
    headline: 'SITUATION UNDER CONTROL',
    dek: (run) =>
      `Officials confirm India Gate "fully secured" beneath an estimated ${countLabel(run.swarm)} cockroaches at ${clockLabel(run.endTick)}. Pigeon declines to comment.`,
    quote: '"See? Not a single cockroach is getting through."',
    art: gateInk,
    crowd: true,
    stats: agencyStats,
    share: AGENCY_SHARE,
  },
  [EndReason.Held]: {
    theme: Theme.Paper,
    kicker: 'Agency run',
    headline: 'SITUATION ACTUALLY UNDER CONTROL',
    dek: (run) =>
      `India Gate held till 9:00 PM with ${String(run.control)}% Control left. Experts demand a recount.`,
    quote: '"Nobody believes it either."',
    art: gateInk,
    crowd: false,
    stats: agencyStats,
    share: () => 'I held India Gate till 9:00 PM. The situation is actually under control.',
  },
  [EndReason.Listened]: {
    theme: Theme.Paper,
    kicker: 'Agency run',
    headline: 'RESULTS DECLARED ON TIME',
    dek: () =>
      'For the first time this year, someone in charge actually listened. The swarm went home to study.',
    quote: '"The microphone was turned around."',
    art: gateInk,
    crowd: false,
    stats: agencyStats,
    share: () => 'I found the other button at India Gate. Can you?',
  },
  [EndReason.ReachedGate]: {
    theme: Theme.Night,
    kicker: 'Cockroach run · 9:00 PM · Kartavya Path',
    headline: 'WE REACHED THE GATE.',
    dek: (run) =>
      `${countLabel(run.reached)} of you made it, peacefully. The swarm formed one question under the arch and waited for an answer.`,
    quote: '',
    art: gateTricolour,
    crowd: false,
    stats: swarmStats,
    share: SWARM_SHARE,
  },
  [EndReason.NextExam]: {
    theme: Theme.Night,
    kicker: 'Cockroach run · 9:00 PM · Kartavya Path',
    headline: 'SEE YOU AT THE NEXT EXAM.',
    dek: (run) =>
      `${countLabel(run.reached)} reached the arch; ${countLabel(REACHED_QUOTA)} were needed. The paper leaks again next year. So will we.`,
    quote: '',
    art: gateTricolour,
    crowd: false,
    stats: swarmStats,
    share: SWARM_SHARE,
  },
};
