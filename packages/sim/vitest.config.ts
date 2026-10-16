import { defineProject } from 'vitest/config';

export default defineProject({
  resolve: { conditions: ['source'] },
  test: { name: 'sim', include: ['test/**/*.test.ts'] },
});
