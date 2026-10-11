import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env['CI']);

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: 0,
  workers: isCI ? 4 : undefined,
  reporter: isCI
    ? [['html', { open: 'never', outputFolder: 'playwright-report-visual' }], ['github']]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-visual' }]],
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled', caret: 'hide' } },
  use: { baseURL: 'http://localhost:6007', timezoneId: 'Europe/Brussels', locale: 'en' },
  projects: [
    {
      name: 'desktop-light',
      use: { ...devices['Desktop Chrome'], colorScheme: 'light' },
      metadata: { theme: 'light' },
    },
    {
      name: 'desktop-dark',
      use: { ...devices['Desktop Chrome'], colorScheme: 'dark' },
      metadata: { theme: 'dark' },
    },
    {
      name: 'mobile-light',
      use: { ...devices['Pixel 7'], colorScheme: 'light' },
      metadata: { theme: 'light' },
    },
  ],
  webServer: {
    command: 'node scripts/serve-static.mjs ../storybook/storybook-static 6007',
    url: 'http://localhost:6007/index.json',
    reuseExistingServer: !isCI,
  },
});
