import { BUNDLED, isEdition } from '../src/content/edition.ts';
import {
  type Live,
  liveKey,
  minuteKey,
  parseBeat,
  parseLimits,
  sampleFor,
  SIDES,
  smooth,
  WINDOW_MINUTES,
} from '../src/shared/live.ts';
import type { ConfigReader, Redis } from './stores.ts';

export interface Deps {
  readonly redis: Redis | undefined;
  readonly config: ConfigReader;
  readonly now: () => number;
}

const SAMPLE_KEY = 'live:k';
const MINUTE_MS = 60_000;
const LIVE_CACHE = 'public, s-maxage=30, stale-while-revalidate=120';
const EDITION_CACHE = 'public, s-maxage=300, stale-while-revalidate=86400';
const NO_STORE = 'no-store';

const BEAT_SCRIPT = `
local k = tonumber(ARGV[1])
local server = tonumber(redis.call('GET', KEYS[2]) or '1')
if k < server / 2 or k > server * 2 then return 0 end
redis.call('INCRBY', KEYS[1], k)
redis.call('EXPIRE', KEYS[1], 600)
return 1`;

const json = (body: unknown, cache: string, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cache },
  });

const empty = (status: number): Response =>
  new Response(null, { status, headers: { 'Cache-Control': NO_STORE } });

const sameOrigin = (request: Request): boolean => {
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  return (
    origin !== null && new URL(origin).host === new URL(request.url).host && site !== 'cross-site'
  );
};

export const handleBeat = async (request: Request, deps: Deps): Promise<Response> => {
  if (request.method !== 'POST') return empty(405);
  if (!sameOrigin(request)) return empty(403);
  const beat = parseBeat(await request.text());
  if (beat === undefined) return empty(400);
  const minute = liveKey(beat.side, minuteKey(deps.now()));
  await deps.redis?.run([['EVAL', BEAT_SCRIPT, 2, minute, SAMPLE_KEY, beat.k]]).catch(() => []);
  return empty(204);
};

const OFF: Live = { on: false, cockroach: 0, agency: 0, k: 1 };

const windowKeys = (now: number): string[] =>
  SIDES.flatMap((side) =>
    Array.from({ length: WINDOW_MINUTES }, (_, back) =>
      liveKey(side, minuteKey(now - (WINDOW_MINUTES - back) * MINUTE_MS)),
    ),
  );

const counts = (values: unknown): number[] =>
  (Array.isArray(values) ? values : []).map((value) => Number(value ?? 0) || 0);

export const handleLive = async (deps: Deps): Promise<Response> => {
  const limits = parseLimits(await deps.config('limits'));
  if (!limits.counterOn || deps.redis === undefined) return json(OFF, LIVE_CACHE);
  try {
    const [values] = await deps.redis.run([['MGET', ...windowKeys(deps.now())]]);
    const minutes = counts(values);
    const cockroach = smooth(minutes.slice(0, WINDOW_MINUTES));
    const agency = smooth(minutes.slice(WINDOW_MINUTES));
    const k = sampleFor(cockroach + agency, limits.beatsPerMinute);
    await deps.redis.run([['SET', SAMPLE_KEY, k]]);
    return json({ on: true, cockroach, agency, k } satisfies Live, LIVE_CACHE);
  } catch {
    return json(OFF, LIVE_CACHE);
  }
};

export const handleEdition = async (deps: Deps): Promise<Response> => {
  const stored = await deps.config('edition');
  return json(isEdition(stored) ? stored : BUNDLED, EDITION_CACHE);
};
