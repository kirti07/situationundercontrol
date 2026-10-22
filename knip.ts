import type { KnipConfig } from 'knip';

const CSS_IMPORT = /@import\s+['"]([^'"]+)['"]/g;

const config: KnipConfig = {
  workspaces: {
    '.': { entry: ['tools/*.ts'], project: ['tools/**/*.ts'] },
    'apps/game': {
      entry: ['api/*.ts'],
      project: ['src/**/*.{ts,css}', 'server/**/*.ts', 'api/**/*.ts'],
    },
  },
  compilers: {
    css: (text: string) =>
      [...text.matchAll(CSS_IMPORT)].map(([, path]) => `import '${path ?? ''}';`).join('\n'),
  },
  // Types named in exported signatures stay exported so they read as part of the API.
  ignoreExportsUsedInFile: { interface: true, type: true },
};

export default config;
