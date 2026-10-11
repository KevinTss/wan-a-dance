import { nodeProject } from '@wad/config/vitest';

export default nodeProject({
  coverage: {
    provider: 'v8',
    include: ['src/**/*.ts'],
    exclude: ['src/**/*.test.ts', 'src/index.ts'],
    thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
  },
});
