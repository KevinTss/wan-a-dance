import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/smoke',
  retries: 2,
  reporter: [['list'], ['github']],
  use: { baseURL: process.env['E2E_BASE_URL'] ?? 'https://wan-a.dance' },
});
