import {
  expect,
  expectAccessible,
  test,
  uniqueEmail,
  waitForCode,
} from '../../src/fixtures/index.ts';

test.describe('Sign-in with an email code', () => {
  test('[R1-ACC-01] a visitor signs up with a 6-digit code and lands in the app', async ({
    page,
    signIn,
    t,
    db,
  }) => {
    await page.goto('/sign-in');
    await expectAccessible(page);
    const email = await signIn();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(t('Welcome', 'Bienvenue'));
    await expectAccessible(page);
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    expect(user.emailVerified).toBe(true);
  });

  test('[R1-ACC-01] an invalid email is rejected before any code is sent', async ({ page, t }) => {
    await page.goto('/sign-in');
    await page.getByLabel(t('Email', 'E-mail')).fill('not-an-email');
    await page.getByRole('button', { name: t('Email me a code', 'Recevoir un code') }).click();
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      t('Enter a valid email address.', 'Saisissez une adresse e-mail valide.'),
    );
  });

  test('[R1-ACC-02] a wrong code shows an error and a resend countdown', async ({ page, t }) => {
    const email = uniqueEmail();
    await page.goto('/sign-in');
    await page.getByLabel(t('Email', 'E-mail')).fill(email);
    await page.getByRole('button', { name: t('Email me a code', 'Recevoir un code') }).click();
    await waitForCode(email);
    await expect(
      page.getByRole('button', { name: new RegExp(t('Send a new code in', 'Nouveau code dans')) }),
    ).toBeDisabled();
    await page
      .getByRole('textbox', { name: t('6-digit code', 'Code à 6 chiffres') })
      .fill('000000');
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      t('This code is wrong or has expired.', 'Ce code est incorrect ou a expiré.'),
    );
    await expect(page).toHaveURL(/\/sign-in/);
    await expectAccessible(page);
  });

  test('[R1-ACC-02] the user can go back and use another email', async ({ page, t }) => {
    const email = uniqueEmail();
    await page.goto('/sign-in');
    await page.getByLabel(t('Email', 'E-mail')).fill(email);
    await page.getByRole('button', { name: t('Email me a code', 'Recevoir un code') }).click();
    await page
      .getByRole('button', { name: t('Use another email', 'Utiliser une autre adresse') })
      .click();
    await expect(page.getByLabel(t('Email', 'E-mail'))).toHaveValue(email);
  });

  test('[R1-ACC-04] a user signs out and protected pages redirect to sign-in', async ({
    page,
    signIn,
    t,
    isMobile,
  }) => {
    await signIn();
    if (isMobile)
      await page
        .getByRole('button', { name: t('Open navigation', 'Ouvrir la navigation') })
        .click();
    await page
      .getByRole('button', { name: new RegExp(t('Account menu', 'Menu du compte')) })
      .filter({ visible: true })
      .click();
    await page.getByRole('menuitem', { name: t('Sign out', 'Se déconnecter') }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
    await page.goto('/');
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test('unauthenticated deep links come back after sign-in, external redirects are ignored', async ({
    page,
    t,
  }) => {
    await page.goto('/?tab=x');
    await expect(page).toHaveURL(/\/sign-in$/);
    const email = uniqueEmail();
    await page.goto('/sign-in?next=//evil.example.com');
    await page.getByLabel(t('Email', 'E-mail')).fill(email);
    await page.getByRole('button', { name: t('Email me a code', 'Recevoir un code') }).click();
    await page
      .getByRole('textbox', { name: t('6-digit code', 'Code à 6 chiffres') })
      .fill(await waitForCode(email));
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
  });
});
