import { describe, expect, it } from 'vitest';
import { handleBeat, handleEdition, handleLive, type Deps } from '../server/handlers.ts';
import type { Command, Redis } from '../server/stores.ts';
import { BUNDLED } from '../src/content/edition.ts';
import { nextRandom } from '../src/core/rng.ts';
import {
  displayCount,
  liveKey,
  minuteKey,
  parseBeat,
  sampleFor,
  smooth,
  withinStep,
} from '../src/shared/live.ts';

const NOW = Date.UTC(2026, 9, 22, 18, 30, 15);

const fakeRedis = (values: Readonly<Record<string, number>> = {}): Redis & { log: Command[] } => {
  const log: Command[] = [];
  return {
    log,
    run: (commands) => {
      log.push(...commands);
      return Promise.resolve(
        commands.map(([name, ...keys]) =>
          name === 'MGET' ? keys.map((key) => values[String(key)] ?? null) : 'OK',
        ),
      );
    },
  };
};

const depsOf = (redis: Redis | undefined, config: Record<string, unknown> = {}): Deps => ({
  redis,
  config: (key) => Promise.resolve(config[key]),
  now: () => NOW,
});

const beat = (body: string, origin = 'https://situationundercontrol.in'): Request =>
  new Request('https://situationundercontrol.in/api/beat', {
    method: 'POST',
    headers: { origin, 'sec-fetch-site': 'same-origin' },
    body,
  });

describe('the live-counter contract', () => {
  it('raises the sample divisor in powers of two to stay under the beat budget', () => {
    expect(sampleFor(10, 15)).toBe(1);
    expect(sampleFor(1000, 15)).toBe(128);
    expect(sampleFor(100_000, 15)).toBe(8192);
  });

  it('accepts a client divisor only one step from the server', () => {
    expect(withinStep(4, 8)).toBe(true);
    expect(withinStep(32, 8)).toBe(false);
    expect(withinStep(6, 8)).toBe(false);
  });

  it('accepts a beat with exactly a side and a power-of-two k', () => {
    expect(parseBeat('{"side":"agency","k":4}')).toEqual({ side: 'agency', k: 4 });
    expect(parseBeat('{"side":"agency","k":3}')).toBeUndefined();
    expect(parseBeat('{"side":"mayor","k":1}')).toBeUndefined();
    expect(parseBeat('{"side":"agency","k":1,"x":1}')).toBeUndefined();
    expect(parseBeat(`{"side":"agency","k":1,"pad":"${'x'.repeat(80)}"}`)).toBeUndefined();
    expect(parseBeat('not json')).toBeUndefined();
  });

  it("caps a one-minute spike at three times the window's median", () => {
    expect(smooth([100, 100, 100, 100, 100])).toBe(100);
    expect(smooth([10, 10, 10, 10, 9000])).toBe(14);
  });

  it('shows exact counts for small crowds and two figures for big ones', () => {
    expect(displayCount(143, 1)).toBe('143');
    expect(displayCount(12_437, 64)).toBe('~12,000');
  });

  it('keeps the sampled estimate close to the real number of players', () => {
    const players = 5000;
    const k = sampleFor(players, 15);
    let random = 99;
    let estimate = 0;
    const minutes = 20;
    for (let minute = 0; minute < minutes * players; minute += 1) {
      random = nextRandom(random);
      if (random % k === 0) estimate += k;
    }
    expect(Math.abs(estimate / minutes - players) / players).toBeLessThan(0.15);
  });
});

describe('POST /api/beat', () => {
  it('counts a same-origin beat in the current minute', async () => {
    const redis = fakeRedis();
    const response = await handleBeat(beat('{"side":"cockroach","k":2}'), depsOf(redis));
    expect(response.status).toBe(204);
    expect(redis.log[0]?.[0]).toBe('EVAL');
    expect(redis.log[0]).toContain(liveKey('cockroach', minuteKey(NOW)));
  });

  it('refuses a beat from another site', async () => {
    const response = await handleBeat(
      beat('{"side":"cockroach","k":1}', 'https://evil.example'),
      depsOf(fakeRedis()),
    );
    expect(response.status).toBe(403);
  });

  it('refuses a malformed beat', async () => {
    expect((await handleBeat(beat('{"side":"cockroach"}'), depsOf(fakeRedis()))).status).toBe(400);
  });

  it('still answers when Redis is down', async () => {
    const broken: Redis = { run: () => Promise.reject(new Error('down')) };
    expect((await handleBeat(beat('{"side":"agency","k":1}'), depsOf(broken))).status).toBe(204);
  });
});

describe('GET /api/live', () => {
  const minutes = (side: 'cockroach' | 'agency', value: number): Record<string, number> =>
    Object.fromEntries(
      [5, 4, 3, 2, 1].map((back) => [liveKey(side, minuteKey(NOW - back * 60_000)), value]),
    );

  it('averages the last five minutes per side and sets the next divisor', async () => {
    const redis = fakeRedis({ ...minutes('cockroach', 1200), ...minutes('agency', 300) });
    const response = await handleLive(depsOf(redis));
    expect(await response.json()).toEqual({ on: true, cockroach: 1200, agency: 300, k: 128 });
    expect(response.headers.get('cache-control')).toContain('s-maxage=30');
    expect(redis.log).toContainEqual(['SET', 'live:k', 128]);
  });

  it('switches off from Edge Config without a deploy', async () => {
    const response = await handleLive(depsOf(fakeRedis(), { limits: { counterOn: false } }));
    expect(await response.json()).toMatchObject({ on: false });
  });

  it('switches off when Redis is not configured', async () => {
    expect(await (await handleLive(depsOf(undefined))).json()).toMatchObject({ on: false });
  });
});

describe('GET /api/edition', () => {
  it('serves the edition from Edge Config when it is valid', async () => {
    const next = { ...BUNDLED, edition: 99 };
    expect(await (await handleEdition(depsOf(undefined, { edition: next }))).json()).toEqual(next);
  });

  it('falls back to the bundled edition when Edge Config has something invalid', async () => {
    const bad = { ...BUNDLED, burningIssues: ['THIS LABEL IS FAR TOO LONG TO FIT'] };
    expect(await (await handleEdition(depsOf(undefined, { edition: bad }))).json()).toEqual(
      BUNDLED,
    );
  });
});
