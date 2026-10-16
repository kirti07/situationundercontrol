import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const patterns: readonly RegExp[] = [
  /UPSTASH_REDIS_REST_TOKEN/,
  /RATE_LIMIT_SECRET/,
  /https:\/\/[a-z0-9-]+\.upstash\.io/,
];

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
  );

const root = process.argv[2] ?? 'dist';
const leaks = files(root).filter((file) => {
  const text = readFileSync(file, 'latin1');
  return patterns.some((pattern) => pattern.test(text));
});

if (leaks.length > 0) {
  console.error(`Server secrets found in client bundle:\n${leaks.join('\n')}`);
  process.exit(1);
}
console.log(`No server secrets in ${root}`);
