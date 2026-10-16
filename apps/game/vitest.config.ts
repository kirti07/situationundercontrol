import { defineProject } from 'vitest/config';

export default defineProject({
  resolve: { conditions: ['source'] },
  test: { name: 'game', include: ['test/**/*.test.ts'] },
});
