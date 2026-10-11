import { expect, expectAccessible, test } from '../../src/fixtures/index.ts';

test.describe('App shell', () => {
  test.beforeEach(async ({ signIn }) => {
    await signIn();
  });

  test('[R1-X-01] a user switches language and it sticks after reload', async ({
    page,
    t,
    isMobile,
    lang,
  }) => {
    const target = lang === 'en' ? 'Français' : 'English';
    if (isMobile)
      await page
        .getByRole('button', { name: t('Open navigation', 'Ouvrir la navigation') })
        .click();
    await page
      .getByRole('button', { name: new RegExp(t('Account menu', 'Menu du compte')) })
      .filter({ visible: true })
      .click();
    await page.getByRole('menuitem', { name: target }).click();
    if (isMobile) await page.keyboard.press('Escape');
    const expected = lang === 'en' ? 'Bienvenue' : 'Welcome';
    await expect(page.getByRole('heading', { level: 1 })).toContainText(expected);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(expected);
    await expect(page.locator('html')).toHaveAttribute('lang', lang === 'en' ? 'fr' : 'en');
  });

  test('[R1-X-02] a user switches to dark mode', async ({ page, t, isMobile }) => {
    if (isMobile)
      await page
        .getByRole('button', { name: t('Open navigation', 'Ouvrir la navigation') })
        .click();
    await page
      .getByRole('button', { name: new RegExp(t('Account menu', 'Menu du compte')) })
      .filter({ visible: true })
      .click();
    await page.getByRole('menuitem', { name: t('Dark', 'Sombre') }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.keyboard.press('Escape');
    await expectAccessible(page);
  });

  test('[R1-X-04] ⌘K opens the command bar and runs an action', async ({ page, t, isMobile }) => {
    test.skip(isMobile, 'Keyboard shortcut is a desktop affordance');
    await page.keyboard.press('ControlOrMeta+k');
    const input = page.getByPlaceholder(t('Search or jump to…', 'Rechercher ou aller à…'));
    await expect(input).toBeVisible();
    await input.fill(t('theme', 'thème'));
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', /dark|light/);
    await expect(input).toBeHidden();
  });

  test('[R1-X-05] the app version is visible for support', async ({ page, t, isMobile }) => {
    if (isMobile)
      await page
        .getByRole('button', { name: t('Open navigation', 'Ouvrir la navigation') })
        .click();
    await expect(page.getByTestId('app-version').filter({ visible: true })).toHaveText(
      /Version \d+\.\d+\.\d+ · \w+/,
    );
  });

  test('[R1-X-03] the shell works on a phone-sized screen', async ({ page, t, isMobile }) => {
    test.skip(!isMobile, 'Mobile only');
    await page.getByRole('button', { name: t('Open navigation', 'Ouvrir la navigation') }).click();
    await expect(
      page.getByRole('dialog').getByRole('link', { name: t('Home', 'Accueil') }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
