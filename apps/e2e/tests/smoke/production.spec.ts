import { expect, test } from '@playwright/test';

test('health endpoint answers with a version', async ({ request }) => {
  const res = await request.get('/api/v1/health');
  expect(res.status()).toBe(200);
  expect(await res.json()).toMatchObject({ ok: true, data: { status: 'ok' } });
});

test('sign-in page renders', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('textbox')).toBeVisible();
});
