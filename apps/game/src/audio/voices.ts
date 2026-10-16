const SILENT = 0.0001;
const TAIL = 0.02;
const DEFAULT_ATTACK = 0.005;
const OPEN_FILTER = 20_000;

export interface Voice {
  readonly ctx: AudioContext;
  readonly out: AudioNode;
  readonly noise: AudioBuffer;
}

interface Shape {
  readonly delay?: number;
  readonly length: number;
  readonly gain: number;
  readonly attack?: number;
}

interface Vibrato {
  readonly rate: number;
  readonly depth: number;
}

export interface ToneSpec extends Shape {
  readonly wave: OscillatorType;
  readonly from: number;
  readonly to?: number;
  readonly cutoff?: number;
  readonly vibrato?: Vibrato;
}

export interface NoiseSpec extends Shape {
  readonly filter: BiquadFilterType;
  readonly from: number;
  readonly to?: number;
  readonly q?: number;
}

export const createNoise = (ctx: BaseAudioContext, seconds: number): AudioBuffer => {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
};

const envelope = (ctx: BaseAudioContext, start: number, shape: Shape): GainNode => {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(SILENT, start);
  gain.gain.exponentialRampToValueAtTime(shape.gain, start + (shape.attack ?? DEFAULT_ATTACK));
  gain.gain.exponentialRampToValueAtTime(SILENT, start + shape.length);
  return gain;
};

const sweep = (param: AudioParam, from: number, to: number, start: number, end: number): void => {
  param.setValueAtTime(from, start);
  param.exponentialRampToValueAtTime(to, end);
};

const wobble = (
  ctx: BaseAudioContext,
  target: AudioParam,
  vibrato: Vibrato | undefined,
  start: number,
  end: number,
): void => {
  if (!vibrato) return;
  const lfo = ctx.createOscillator();
  const depth = ctx.createGain();
  lfo.frequency.value = vibrato.rate;
  depth.gain.value = vibrato.depth;
  lfo.connect(depth).connect(target);
  lfo.start(start);
  lfo.stop(end);
};

export const tone = (voice: Voice, at: number, spec: ToneSpec): void => {
  const { ctx } = voice;
  const start = at + (spec.delay ?? 0);
  const end = start + spec.length + TAIL;
  const oscillator = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  oscillator.type = spec.wave;
  filter.frequency.value = spec.cutoff ?? OPEN_FILTER;
  sweep(oscillator.frequency, spec.from, spec.to ?? spec.from, start, start + spec.length);
  wobble(ctx, oscillator.frequency, spec.vibrato, start, end);
  oscillator
    .connect(filter)
    .connect(envelope(ctx, start, spec))
    .connect(voice.out);
  oscillator.start(start);
  oscillator.stop(end);
};

export const chord = (
  voice: Voice,
  at: number,
  notes: readonly number[],
  spec: Omit<ToneSpec, 'from' | 'to'>,
): void => {
  for (const note of notes) tone(voice, at, { ...spec, from: note });
};

export const noise = (voice: Voice, at: number, spec: NoiseSpec): void => {
  const { ctx } = voice;
  const start = at + (spec.delay ?? 0);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  source.buffer = voice.noise;
  filter.type = spec.filter;
  filter.Q.value = spec.q ?? 1;
  sweep(filter.frequency, spec.from, spec.to ?? spec.from, start, start + spec.length);
  source
    .connect(filter)
    .connect(envelope(ctx, start, spec))
    .connect(voice.out);
  const offset = Math.random() * Math.max(0, voice.noise.duration - spec.length);
  source.start(start, offset);
  source.stop(start + spec.length + TAIL);
};
