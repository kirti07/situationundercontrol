export type Sound =
  | 'jump'
  | 'collect'
  | 'news'
  | 'whack'
  | 'refill'
  | 'exitOpen'
  | 'asleep'
  | 'caught'
  | 'clear'
  | 'over';

type Note = readonly [frequency: number, seconds: number, wave?: OscillatorType];

const TUNES: Readonly<Record<Sound, readonly Note[]>> = {
  jump: [
    [392, 0.05],
    [523, 0.05],
  ],
  collect: [
    [784, 0.06],
    [1047, 0.09],
  ],
  news: [
    [880, 0.05],
    [660, 0.05],
    [880, 0.05],
    [1320, 0.12],
  ],
  whack: [
    [180, 0.04, 'sawtooth'],
    [90, 0.08, 'sawtooth'],
  ],
  refill: [
    [440, 0.06, 'triangle'],
    [660, 0.1, 'triangle'],
  ],
  exitOpen: [
    [523, 0.08],
    [659, 0.08],
    [784, 0.08],
    [1047, 0.16],
  ],
  asleep: [
    [330, 0.12, 'triangle'],
    [262, 0.18, 'triangle'],
  ],
  caught: [
    [220, 0.12, 'sawtooth'],
    [165, 0.12, 'sawtooth'],
    [110, 0.3, 'sawtooth'],
  ],
  clear: [
    [523, 0.1],
    [659, 0.1],
    [784, 0.1],
    [1047, 0.1],
    [784, 0.1],
    [1047, 0.3],
  ],
  over: [
    [392, 0.2, 'triangle'],
    [330, 0.2, 'triangle'],
    [262, 0.45, 'triangle'],
  ],
};

const VOLUME = 0.06;

export interface Audio {
  readonly play: (sound: Sound) => void;
  readonly setMuted: (muted: boolean) => void;
  readonly unlock: () => void;
  readonly close: () => void;
}

export const createAudio = (muted: boolean): Audio => {
  let context: AudioContext | undefined;
  let silent = muted;
  const note = (
    ctx: AudioContext,
    [frequency, seconds, wave = 'square']: Note,
    at: number,
  ): number => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = wave;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(VOLUME, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + seconds);
    return at + seconds;
  };
  return {
    play: (sound) => {
      if (silent || context === undefined) return;
      const ctx = context;
      TUNES[sound].reduce((at, part) => note(ctx, part, at), ctx.currentTime);
    },
    setMuted: (value) => {
      silent = value;
    },
    unlock: () => {
      context ??= new AudioContext();
      void context.resume();
    },
    close: () => {
      void context?.close();
    },
  };
};
