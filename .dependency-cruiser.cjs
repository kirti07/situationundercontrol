module.exports = {
  forbidden: [
    {
      name: 'browser-never-imports-server',
      severity: 'error',
      from: { path: '^apps/game/src' },
      to: { path: '^apps/game/(api|server)' },
    },
    {
      name: 'server-never-imports-browser',
      severity: 'error',
      from: { path: '^apps/game/(api|server)' },
      to: { path: '^apps/game/src/(engine|screens|net)' },
    },
    {
      name: 'core-is-pure',
      severity: 'error',
      from: { path: '^apps/game/src/(core|content|shared)' },
      to: { path: '^apps/game/src/(engine|screens|net)' },
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
  },
};
