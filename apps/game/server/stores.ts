export type Env = Readonly<Record<string, string | undefined>>;
export type Command = readonly (string | number)[];

export interface Redis {
  readonly run: (commands: readonly Command[]) => Promise<unknown[]>;
}

export type ConfigReader = (key: string) => Promise<unknown>;

const TIMEOUT_MS = 1500;

export const redisFrom = (env: Env): Redis | undefined => {
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  if (url === undefined || token === undefined) return undefined;
  return {
    run: async (commands) => {
      const response = await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(commands),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`Redis answered ${String(response.status)}`);
      const results = (await response.json()) as { result?: unknown }[];
      return results.map((entry) => entry.result);
    },
  };
};

export const configFrom = (env: Env): ConfigReader => {
  const connection = env.EDGE_CONFIG;
  if (connection === undefined) return () => Promise.resolve(undefined);
  const url = new URL(connection);
  const token = url.searchParams.get('token') ?? '';
  return async (key) => {
    try {
      const item = new URL(`${url.pathname}/item/${encodeURIComponent(key)}`, url.origin);
      item.searchParams.set('token', token);
      const response = await fetch(item, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) return undefined;
      const value: unknown = await response.json();
      return value;
    } catch {
      return undefined;
    }
  };
};
