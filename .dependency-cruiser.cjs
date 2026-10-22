module.exports = {
  forbidden: [
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
