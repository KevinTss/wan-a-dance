import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, E2E_PORT, e2eDatabaseUrl } from './src/env.ts';

const isCI = Boolean(process.env['CI']);
const external = Boolean(process.env['E2E_BASE_URL']);

const locales = ['en', 'fr'] as const;
const devicesByName = {
  desktop: devices['Desktop Chrome'],
  mobile: devices['Pixel 7'],
} as const;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  failOnFlakyTests: isCI,
  workers: isCI ? 4 : undefined,
  reporter: isCI
    ? [['html', { open: 'never' }], ['github'], ['list']]
    : [['html', { open: 'never' }], ['list']],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    timezoneId: 'Europe/Brussels',
  },
  projects: [
    ...locales.flatMap((locale) =>
      (['desktop', 'mobile'] as const).map((deviceName) => ({
        name: `ui-${deviceName}-${locale}`,
        testDir: './tests/ui',
        use: { ...devicesByName[deviceName], locale },
      })),
    ),
    ...(process.env['NIGHTLY']
      ? (['firefox', 'webkit'] as const).map((browser) => ({
          name: `ui-${browser}-en`,
          testDir: './tests/ui',
          use: {
            ...devices[browser === 'firefox' ? 'Desktop Firefox' : 'Desktop Safari'],
            locale: 'en',
          },
        }))
      : []),
    { name: 'api', testDir: './tests/api', use: { locale: 'en' } },
  ],
  webServer: external
    ? undefined
    : {
        command: `pnpm --filter @wad/web exec next start -p ${String(E2E_PORT)}`,
        url: `${BASE_URL}/api/v1/health`,
        reuseExistingServer: !isCI,
        timeout: 120_000,
        stdout: 'pipe',
        env: {
          DATABASE_URL: e2eDatabaseUrl(),
          BETTER_AUTH_URL: BASE_URL,
          NEXT_PUBLIC_APP_URL: BASE_URL,
          BETTER_AUTH_SECRET: 'e2e-secret-e2e-secret-e2e-secret-0000',
          MAIL_ADAPTER: 'console',
          PUBLIC_API_ENABLED: 'true',
        },
      },
});
