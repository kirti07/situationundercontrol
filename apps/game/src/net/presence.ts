import type { Side } from '../content/roles.ts';
import { fetchLive, sampleRate } from './live.ts';

const FIRST_BEAT_MS = 5000;
const BEAT_MS = 60_000;
const JITTER_MS = 10_000;
const REFRESH_EVERY = 5;

const send = (side: Side, k: number): void => {
  void fetch('/api/beat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ side, k }),
    keepalive: true,
  }).catch(() => undefined);
};

export const startPresence = (side: Side, playing: () => boolean): (() => void) => {
  let timer = 0;
  let beats = 0;
  const beat = (): void => {
    beats += 1;
    if (beats % REFRESH_EVERY === 0) void fetchLive();
    const k = sampleRate();
    if (playing() && document.visibilityState === 'visible' && Math.random() < 1 / k) send(side, k);
    timer = window.setTimeout(beat, BEAT_MS + (Math.random() * 2 - 1) * JITTER_MS);
  };
  timer = window.setTimeout(beat, FIRST_BEAT_MS);
  return () => {
    window.clearTimeout(timer);
  };
};
