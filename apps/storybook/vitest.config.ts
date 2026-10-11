import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';
import { defineConfig, type TestProjectInlineConfiguration } from 'vitest/config';

const configDir = fileURLToPath(new URL('./.storybook', import.meta.url));

function project(
  name: string,
  setupFile: string,
  viewport: { width: number; height: number },
  tags: { include?: string[]; exclude?: string[] },
): TestProjectInlineConfiguration {
  return {
    extends: true,
    plugins: [storybookTest({ configDir, tags })],
    test: {
      name,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [{ browser: 'chromium' }],
        viewport,
      },
      setupFiles: [setupFile],
    },
  };
}

const desktop = { width: 1280, height: 800 };
const mobile = { width: 390, height: 844 };

export default defineConfig({
  test: {
    projects: [
      project('storybook', '.storybook/vitest.setup.ts', desktop, { exclude: ['mobile'] }),
      project('storybook-dark', '.storybook/vitest.setup.dark.ts', desktop, {
        exclude: ['mobile'],
      }),
      project('storybook-mobile', '.storybook/vitest.setup.ts', mobile, { include: ['mobile'] }),
    ],
  },
});
