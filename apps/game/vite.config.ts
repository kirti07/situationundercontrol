import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

interface VercelHeaderRule {
  readonly source: string;
  readonly headers: readonly { readonly key: string; readonly value: string }[];
}

const vercel = JSON.parse(readFileSync(new URL('vercel.json', import.meta.url), 'utf8')) as {
  readonly headers: readonly VercelHeaderRule[];
};

const productionHeaders = Object.fromEntries(
  vercel.headers
    .filter((rule) => rule.source === '/(.*)')
    .flatMap((rule) => rule.headers.map((header) => [header.key, header.value])),
);

export default defineConfig({
  resolve: { conditions: ['source'] },
  build: {
    target: 'es2022',
    modulePreload: { polyfill: false },
    assetsInlineLimit: 0,
    sourcemap: true,
  },
  preview: { headers: productionHeaders },
});
