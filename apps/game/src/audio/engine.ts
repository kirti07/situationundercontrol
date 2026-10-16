import { RECIPES, SOUND_COUNT, type Sound } from './sounds.ts';
import { createNoise, type Voice } from './voices.ts';

const MASTER_GAIN = 0.8;
const NOISE_SECONDS = 2;
const CROWD_GAIN = 0.12;
const CROWD_CUTOFF = 520;
const CROWD_SMOOTHING = 0.6;
const RELEASE_MS = 3000;

export interface AudioEngine {
  readonly unlock: () => void;
  readonly play: (sound: Sound, value: number) => void;
  readonly crowd: (level: number) => void;
  readonly setRunning: (running: boolean) => void;
  readonly setMuted: (muted: boolean) => void;
  readonly release: () => void;
}

interface Live {
  readonly voice: Voice;
  readonly crowd: GainNode;
  readonly lastPlayed: Float64Array;
}

const startCrowd = (ctx: AudioContext, noise: AudioBuffer, out: AudioNode): GainNode => {
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = noise;
  source.loop = true;
  filter.frequency.value = CROWD_CUTOFF;
  gain.gain.value = 0;
  source.connect(filter).connect(gain).connect(out);
  source.start();
  return gain;
};

const build = (): Live => {
  const ctx = new AudioContext({ latencyHint: 'interactive' });
  const master = ctx.createGain();
  const limiter = ctx.createDynamicsCompressor();
  master.gain.value = MASTER_GAIN;
  master.connect(limiter).connect(ctx.destination);
  const noise = createNoise(ctx, NOISE_SECONDS);
  return {
    voice: { ctx, out: master, noise },
    crowd: startCrowd(ctx, noise, master),
    lastPlayed: new Float64Array(SOUND_COUNT).fill(-Infinity),
  };
};

const createAudioEngine = (): AudioEngine => {
  let live: Live | null = null;
  let running = true;
  let muted = false;
  let crowdLevel = 0;
  let releaseTimer = 0;

  const audible = (): boolean => running && !muted;

  const sync = (): void => {
    if (!live) return;
    const { ctx } = live.voice;
    const wanted = audible() ? 'running' : 'suspended';
    if (ctx.state === wanted) return;
    void (audible() ? ctx.resume() : ctx.suspend());
  };

  const unlock = (): void => {
    if (!live && audible() && navigator.userActivation.hasBeenActive) live = build();
    sync();
  };

  const setRunning = (value: boolean): void => {
    window.clearTimeout(releaseTimer);
    running = value;
    unlock();
  };

  const crowd = (level: number): void => {
    if (!live || level === crowdLevel) return;
    crowdLevel = level;
    live.crowd.gain.setTargetAtTime(
      level * CROWD_GAIN,
      live.voice.ctx.currentTime,
      CROWD_SMOOTHING,
    );
  };

  return {
    unlock,
    crowd,
    setRunning,
    play: (sound, value) => {
      if (!live || !audible()) return;
      const now = live.voice.ctx.currentTime;
      if (now - (live.lastPlayed[sound] ?? -Infinity) < RECIPES[sound].gap) return;
      live.lastPlayed[sound] = now;
      RECIPES[sound].play(live.voice, now, value);
    },
    setMuted: (value) => {
      muted = value;
      unlock();
    },
    release: () => {
      crowd(0);
      window.clearTimeout(releaseTimer);
      releaseTimer = window.setTimeout(() => {
        running = false;
        sync();
      }, RELEASE_MS);
    },
  };
};

let shared: AudioEngine | null = null;

export const audioEngine = (): AudioEngine => {
  shared ??= createAudioEngine();
  return shared;
};
