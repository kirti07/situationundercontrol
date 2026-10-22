import { defineProject } from 'vitest/config';

export default defineProject({
  test: { name: 'game', include: ['test/**/*.test.ts'] },
});
