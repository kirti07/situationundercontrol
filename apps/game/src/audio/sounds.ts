import { chord, noise, tone, type Voice } from './voices.ts';

export const Sound = {
  Splat: 0,
  Miss: 1,
  Arrive: 2,
  Whistle: 3,
  Thunk: 4,
  Clank: 5,
  Climb: 6,
  Swell: 7,
  Fanfare: 8,
  SadTrombone: 9,
  Buzzer: 10,
  Sting: 11,
  Chime: 12,
  Gong: 13,
  Empty: 14,
  Shutter: 15,
  Whoosh: 16,
  Call: 17,
  Sus: 18,
  Surge: 19,
} as const;
export type Sound = (typeof Sound)[keyof typeof Sound];

export const SOUND_COUNT = Object.keys(Sound).length;

export interface Recipe {
  readonly gap: number;
  readonly play: (voice: Voice, at: number, value: number) => void;
}

const POLICE_WHISTLE = { rate: 28, depth: 90 } as const;
const LIGHTS_ARPEGGIO = [523, 659, 784, 1047] as const;
const ARPEGGIO_STEP = 0.14;
const TROMBONE = [
  [392, 370, 0, 0.26],
  [370, 349, 0.3, 0.26],
  [349, 330, 0.6, 0.26],
  [330, 247, 0.9, 0.8],
] as const;

export const RECIPES: Readonly<Record<Sound, Recipe>> = {
  [Sound.Splat]: {
    gap: 0.035,
    play: (voice, at, hits) => {
      const weight = Math.min(1, 0.6 + hits * 0.1);
      noise(voice, at, {
        filter: 'bandpass',
        from: 2200,
        to: 280,
        q: 1.4,
        length: 0.12,
        gain: 0.4 * weight,
      });
      tone(voice, at, { wave: 'sine', from: 170, to: 48, length: 0.15, gain: 0.5 * weight });
    },
  },
  [Sound.Miss]: {
    gap: 0.05,
    play: (voice, at) => {
      tone(voice, at, { wave: 'triangle', from: 640, to: 420, length: 0.05, gain: 0.07 });
    },
  },
  [Sound.Arrive]: {
    gap: 0.08,
    play: (voice, at) => {
      tone(voice, at, { wave: 'triangle', from: 1320, to: 1760, length: 0.09, gain: 0.06 });
    },
  },
  [Sound.Whistle]: {
    gap: 0.3,
    play: (voice, at) => {
      const blast = { wave: 'sine', from: 2900, gain: 0.1, vibrato: POLICE_WHISTLE } as const;
      tone(voice, at, { ...blast, length: 0.2 });
      tone(voice, at, { ...blast, delay: 0.26, length: 0.4 });
    },
  },
  [Sound.Thunk]: {
    gap: 0.1,
    play: (voice, at) => {
      tone(voice, at, { wave: 'sine', from: 120, to: 36, length: 0.34, gain: 0.6 });
      noise(voice, at, { filter: 'lowpass', from: 1000, to: 120, length: 0.22, gain: 0.5 });
    },
  },
  [Sound.Clank]: {
    gap: 0.12,
    play: (voice, at) => {
      chord(voice, at, [233, 349, 523], { wave: 'square', length: 0.2, gain: 0.05, cutoff: 2600 });
      noise(voice, at, { filter: 'highpass', from: 3200, length: 0.06, gain: 0.22 });
    },
  },
  [Sound.Climb]: {
    gap: 0.6,
    play: (voice, at) => {
      noise(voice, at, {
        filter: 'bandpass',
        from: 350,
        to: 1400,
        q: 2,
        attack: 0.25,
        length: 0.75,
        gain: 0.35,
      });
    },
  },
  [Sound.Swell]: {
    gap: 1,
    play: (voice, at) => {
      noise(voice, at, {
        filter: 'bandpass',
        from: 420,
        to: 720,
        q: 0.8,
        attack: 0.5,
        length: 1.8,
        gain: 0.35,
      });
      chord(voice, at, [147, 220], { wave: 'sine', attack: 0.4, length: 1.6, gain: 0.08 });
    },
  },
  [Sound.Fanfare]: {
    gap: 1,
    play: (voice, at) => {
      const brass = { wave: 'sawtooth', gain: 0.06, cutoff: 1800 } as const;
      chord(voice, at, [262, 330, 392], { ...brass, length: 0.16 });
      chord(voice, at, [349, 440, 523], { ...brass, delay: 0.19, length: 0.55 });
    },
  },
  [Sound.SadTrombone]: {
    gap: 1.5,
    play: (voice, at) => {
      for (const [from, to, delay, length] of TROMBONE) {
        tone(voice, at, {
          wave: 'sawtooth',
          from,
          to,
          delay,
          length,
          gain: 0.07,
          cutoff: 1300,
          vibrato: { rate: 6, depth: 4 },
        });
      }
    },
  },
  [Sound.Buzzer]: {
    gap: 0.25,
    play: (voice, at) => {
      tone(voice, at, { wave: 'square', from: 110, length: 0.2, gain: 0.06, cutoff: 900 });
    },
  },
  [Sound.Sting]: {
    gap: 1,
    play: (voice, at) => {
      chord(voice, at, [110, 117], { wave: 'sawtooth', length: 0.9, gain: 0.07, cutoff: 900 });
      tone(voice, at, { wave: 'sine', from: 880, to: 440, length: 0.6, gain: 0.07 });
      noise(voice, at, { filter: 'lowpass', from: 2400, to: 200, length: 0.5, gain: 0.25 });
    },
  },
  [Sound.Chime]: {
    gap: 2,
    play: (voice, at) => {
      LIGHTS_ARPEGGIO.forEach((note, index) => {
        const delay = index * ARPEGGIO_STEP;
        tone(voice, at, { wave: 'sine', from: note, delay, length: 1.4, gain: 0.1 });
        tone(voice, at, { wave: 'triangle', from: note * 2, delay, length: 0.5, gain: 0.02 });
      });
    },
  },
  [Sound.Empty]: {
    gap: 0.12,
    play: (voice, at) => {
      noise(voice, at, { filter: 'bandpass', from: 900, q: 6, length: 0.04, gain: 0.12 });
      tone(voice, at, {
        wave: 'square',
        from: 180,
        to: 140,
        length: 0.05,
        gain: 0.03,
        cutoff: 1200,
      });
    },
  },
  [Sound.Shutter]: {
    gap: 0.4,
    play: (voice, at) => {
      noise(voice, at, { filter: 'highpass', from: 2400, length: 0.03, gain: 0.25 });
      noise(voice, at, { filter: 'highpass', from: 1800, delay: 0.07, length: 0.05, gain: 0.2 });
    },
  },
  [Sound.Whoosh]: {
    gap: 0.15,
    play: (voice, at) => {
      noise(voice, at, {
        filter: 'bandpass',
        from: 1600,
        to: 380,
        q: 1.5,
        delay: 0.08,
        attack: 0.05,
        length: 0.4,
        gain: 0.12,
      });
    },
  },
  [Sound.Call]: {
    gap: 0.3,
    play: (voice, at) => {
      tone(voice, at, { wave: 'triangle', from: 392, to: 784, length: 0.22, gain: 0.08 });
      tone(voice, at, { wave: 'triangle', from: 523, delay: 0.24, length: 0.18, gain: 0.07 });
    },
  },
  [Sound.Sus]: {
    gap: 0.4,
    play: (voice, at) => {
      tone(voice, at, { wave: 'square', from: 880, length: 0.1, gain: 0.05, cutoff: 2400 });
      tone(voice, at, {
        wave: 'square',
        from: 659,
        delay: 0.12,
        length: 0.18,
        gain: 0.05,
        cutoff: 2400,
      });
    },
  },
  [Sound.Surge]: {
    gap: 0.5,
    play: (voice, at) => {
      noise(voice, at, {
        filter: 'bandpass',
        from: 400,
        to: 1600,
        q: 1.2,
        attack: 0.1,
        length: 0.5,
        gain: 0.2,
      });
      tone(voice, at, { wave: 'triangle', from: 330, to: 660, length: 0.45, gain: 0.06 });
    },
  },
  [Sound.Gong]: {
    gap: 2,
    play: (voice, at) => {
      chord(voice, at, [98, 147, 196], { wave: 'sine', length: 2.4, gain: 0.16 });
      noise(voice, at, { filter: 'bandpass', from: 700, to: 200, length: 0.45, gain: 0.15 });
    },
  },
};
