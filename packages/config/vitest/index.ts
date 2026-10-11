import { defineConfig, type ViteUserConfig } from 'vitest/config';

export function nodeProject(overrides: ViteUserConfig['test'] = {}): ViteUserConfig {
  return defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
      restoreMocks: true,
      env: { TZ: 'UTC' },
      ...overrides,
    },
  });
}
