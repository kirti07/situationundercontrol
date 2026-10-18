import {
  EVENT_STRIDE,
  EventKind,
  isOver,
  LIGHTS_MINUTE,
  MAX_ACTIVE,
  momentResult,
  MomentKind,
  Outcome,
  RUSH_MINUTE,
  swarmOf,
  TICKS_PER_MINUTE,
  type State,
} from '@suc/sim';
import type { AudioEngine } from '../audio/engine.ts';
import { Sound } from '../audio/sounds.ts';
import { at } from '../render/typed.ts';
import type { Haptics } from './haptics.ts';

const CROWD_STEPS = 20;
const SMASH_BUZZ_MS = 12;
const STAMP_BUZZ_MS = 40;
const BACKFIRE_BUZZ_MS = 70;
const CATCH_BUZZ_MS = 30;

type Cue<T> = (value: number) => T;

const RESULT_SOUNDS: Readonly<Partial<Record<number, Sound>>> = {
  [momentResult(MomentKind.Placard, Outcome.Won)]: Sound.Fanfare,
  [momentResult(MomentKind.Placard, Outcome.Lost)]: Sound.Buzzer,
};

const EVENT_SOUNDS: Readonly<Partial<Record<number, Cue<Sound | undefined>>>> = {
  [EventKind.Tap]: (hits) => (hits > 0 ? Sound.Splat : Sound.Miss),
  [EventKind.Enter]: () => Sound.Arrive,
  [EventKind.Smash]: () => Sound.Whoosh,
  [EventKind.StampWarn]: () => Sound.Whistle,
  [EventKind.StampLand]: () => Sound.Thunk,
  [EventKind.Barricade]: () => Sound.Clank,
  [EventKind.Climb]: () => Sound.Climb,
  [EventKind.SitIn]: () => Sound.Swell,
  [EventKind.Power]: () => Sound.Fanfare,
  [EventKind.Backfire]: () => Sound.SadTrombone,
  [EventKind.Muted]: () => Sound.Buzzer,
  [EventKind.Empty]: () => Sound.Empty,
  [EventKind.Filmed]: () => Sound.Shutter,
  [EventKind.Freeze]: () => Sound.Sting,
  [EventKind.MomentOpen]: () => Sound.Call,
  [EventKind.MomentResult]: (value) => RESULT_SOUNDS[value],
  [EventKind.Caught]: () => Sound.Sus,
  [EventKind.WrongAccuse]: () => Sound.Buzzer,
  [EventKind.Surge]: () => Sound.Surge,
  [EventKind.Pinpointed]: () => Sound.Whistle,
  [EventKind.PerfectSitIn]: () => Sound.Chime,
  [EventKind.Bounce]: () => Sound.Clank,
};

const EVENT_BUZZES: Readonly<Partial<Record<number, Cue<number>>>> = {
  [EventKind.Tap]: (hits) => (hits > 0 ? SMASH_BUZZ_MS : 0),
  [EventKind.StampLand]: () => STAMP_BUZZ_MS,
  [EventKind.Backfire]: () => BACKFIRE_BUZZ_MS,
  [EventKind.Caught]: () => CATCH_BUZZ_MS,
  [EventKind.PerfectSitIn]: () => CATCH_BUZZ_MS,
};

interface Milestone {
  readonly sound: Sound;
  readonly reached: (state: State) => boolean;
}

const MILESTONES: readonly Milestone[] = [
  { sound: Sound.Chime, reached: (state) => state.tick >= LIGHTS_MINUTE * TICKS_PER_MINUTE },
  { sound: Sound.Whistle, reached: (state) => state.tick >= RUSH_MINUTE * TICKS_PER_MINUTE },
  { sound: Sound.Gong, reached: isOver },
];

const crowdLevel = (state: State): number =>
  Math.round(Math.min(1, swarmOf(state) / MAX_ACTIVE) * CROWD_STEPS) / CROWD_STEPS;

export interface SoundDirector {
  readonly observe: (state: State) => void;
}

export const createSoundDirector = (
  state: State,
  audio: AudioEngine,
  haptics: Haptics,
): SoundDirector => {
  const pending = MILESTONES.findIndex((milestone) => !milestone.reached(state));
  let next = pending === -1 ? MILESTONES.length : pending;

  const cue = (current: State, offset: number): void => {
    const kind = at(current.events, offset);
    const value = at(current.events, offset + 3);
    const sound = EVENT_SOUNDS[kind]?.(value);
    if (sound !== undefined) audio.play(sound, value);
    haptics.buzz(EVENT_BUZZES[kind]?.(value) ?? 0);
  };

  const passMilestone = (current: State): void => {
    const milestone = MILESTONES[next];
    if (!milestone?.reached(current)) return;
    next += 1;
    audio.play(milestone.sound, 0);
  };

  return {
    observe: (current) => {
      for (let i = 0; i < current.eventCount; i += 1) cue(current, i * EVENT_STRIDE);
      passMilestone(current);
      audio.crowd(crowdLevel(current));
    },
  };
};
