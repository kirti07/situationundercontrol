import { type Live, parseLive } from '../shared/live.ts';

const TIMEOUT_MS = 3000;
let sample = 1;

export const sampleRate = (): number => sample;

export const fetchLive = async (): Promise<Live | undefined> => {
  try {
    const response = await fetch('/api/live', { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const live = response.ok ? parseLive(await response.json()) : undefined;
    if (live?.on === true) sample = live.k;
    return live?.on === true ? live : undefined;
  } catch {
    return undefined;
  }
};
