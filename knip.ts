import type { KnipConfig } from 'knip';

const CSS_IMPORT = /@import\s+['"]([^'"]+)['"]/g;

const config: KnipConfig = {
  workspaces: {
    '.': { entry: ['tools/*.ts'], project: ['tools/**/*.ts'] },
    'packages/sim': {
      entry: ['balance/*.ts', 'test/**/*.ts'],
      project: ['src/**/*.ts', 'balance/**/*.ts', 'test/**/*.ts'],
    },
    'apps/game': { project: ['src/**/*.{ts,css}'] },
  },
  compilers: {
    css: (text: string) =>
      [...text.matchAll(CSS_IMPORT)].map(([, path]) => `import '${path ?? ''}';`).join('\n'),
  },
  // Kept for the Playwright smoke runs; the e2e suite lands in the release phase.
  ignoreDependencies: ['@playwright/test'],
  // Types named in exported signatures stay exported so they read as part of the API.
  ignoreExportsUsedInFile: { interface: true, type: true },
  // Tuning constants may share a value on purpose (SMASH_SYMPATHY = SYMPATHY_SCALE).
  rules: { duplicates: 'off' },
};

export default config;
