import {
  EVENT_STRIDE,
  EventKind,
  LIGHTS_MINUTE,
  RUSH_MINUTE,
  TICKS_PER_MINUTE,
  TICKS_PER_SECOND,
  type State,
} from '@suc/sim';
import { CaptionCue, CAPTIONS } from '../content/captions.ts';

const REPEAT_GAP = 8 * TICKS_PER_SECOND;
const HUNDRED = 100;

const EVENT_CUES: Readonly<Partial<Record<number, CaptionCue>>> = {
  [EventKind.Power]: CaptionCue.Power,
  [EventKind.Backfire]: CaptionCue.Backfire,
  [EventKind.Climb]: CaptionCue.Climb,
  [EventKind.StampLand]: CaptionCue.Stamp,
  [EventKind.SitIn]: CaptionCue.SitIn,
  [EventKind.Barricade]: CaptionCue.Barricade,
};

interface Milestone {
  readonly cue: CaptionCue;
  readonly reached: (state: State) => boolean;
}

const MILESTONES: readonly Milestone[] = [
  { cue: CaptionCue.Start, reached: () => true },
  { cue: CaptionCue.FirstSmash, reached: (state) => state.smashes > 0 },
  { cue: CaptionCue.HundredSmashes, reached: (state) => state.smashes >= HUNDRED },
  { cue: CaptionCue.HundredReached, reached: (state) => state.reached >= HUNDRED },
  { cue: CaptionCue.Lights, reached: (state) => state.tick >= LIGHTS_MINUTE * TICKS_PER_MINUTE },
  { cue: CaptionCue.Rush, reached: (state) => state.tick >= RUSH_MINUTE * TICKS_PER_MINUTE },
];

export interface CaptionDirector {
  readonly observe: (state: State) => string | null;
}

export const createCaptionDirector = (state: State): CaptionDirector => {
  const lines = CAPTIONS[state.character];
  const done = new Set<CaptionCue>();
  const lastShown = new Map<CaptionCue, number>();

  const say = (cue: CaptionCue, tick: number): string | null => {
    const line = lines[cue];
    const recent = tick - (lastShown.get(cue) ?? -REPEAT_GAP) < REPEAT_GAP;
    if (line === undefined || recent) return null;
    lastShown.set(cue, tick);
    return line;
  };

  const fromEvents = (current: State): string | null => {
    for (let i = 0; i < current.eventCount; i += 1) {
      const cue = EVENT_CUES[current.events[i * EVENT_STRIDE] ?? 0];
      const line = cue === undefined ? null : say(cue, current.tick);
      if (line !== null) return line;
    }
    return null;
  };

  const fromMilestones = (current: State): string | null => {
    const next = MILESTONES.find(
      (milestone) => !done.has(milestone.cue) && milestone.reached(current),
    );
    if (!next) return null;
    done.add(next.cue);
    return say(next.cue, current.tick);
  };

  return { observe: (current) => fromMilestones(current) ?? fromEvents(current) };
};
