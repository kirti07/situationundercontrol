module.exports = {
  forbidden: [
    {
      name: 'sim-is-pure',
      severity: 'error',
      from: { path: '^packages/sim/src' },
      to: { pathNot: '^packages/sim/src' },
    },
    {
      name: 'browser-never-imports-server',
      severity: 'error',
      from: { path: '^apps/game/src' },
      to: { path: '^apps/game/(server|api)' },
    },
    {
      name: 'server-never-imports-browser',
      severity: 'error',
      from: { path: '^apps/game/(server|api)' },
      to: { path: '^apps/game/src' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(dist|node_modules)/' },
    tsConfig: { fileName: 'tsconfig.base.json' },
    combinedDependencies: true,
    enhancedResolveOptions: { conditionNames: ['source', 'import', 'default'] },
  },
};
