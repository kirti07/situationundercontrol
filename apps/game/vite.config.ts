import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { conditions: ['source'] },
  build: {
    target: 'es2022',
    modulePreload: { polyfill: false },
    assetsInlineLimit: 0,
    sourcemap: true,
  },
});
