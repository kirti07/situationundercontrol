import type { Deps } from '../server/handlers.ts';
import { configFrom, redisFrom } from '../server/stores.ts';

export const deps = (): Deps => ({
  redis: redisFrom(process.env),
  config: configFrom(process.env),
  now: Date.now,
});
