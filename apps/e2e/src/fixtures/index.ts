import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Page } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { createAuth } from '@wad/auth';
import { createDb, type PrismaClient } from '@wad/db/client';
import { BASE_URL, e2eDatabaseUrl } from '../env.ts';

export type Locale = 'en' | 'fr';

let sharedDb: PrismaClient | undefined;

function db(): PrismaClient {
  sharedDb ??= createDb(e2eDatabaseUrl());
  return sharedDb;
}

export function uniqueEmail(label = 'user'): string {
  return `${label}-${randomBytes(5).toString('hex')}@e2e.wan-a.dance`;
}

function fakeIp(): string {
  const bytes = randomBytes(3);
  return `10.${String(bytes[0])}.${String(bytes[1])}.${String(bytes[2])}`;
}

let sharedAuth: ReturnType<typeof createAuth> | undefined;

function auth() {
  sharedAuth ??= createAuth({
    db: db(),
    secret: 'e2e-secret-e2e-secret-e2e-secret-0000',
    baseURL: BASE_URL,
    mailer: { send: () => Promise.resolve() },
  });
  return sharedAuth;
}

export async function issueCode(email: string): Promise<string> {
  return auth().api.createVerificationOTP({ body: { email, type: 'sign-in' } });
}

export async function expectAccessible(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}

interface Fixtures {
  lang: Locale;
  t: (en: string, fr: string) => string;
  signIn: (email?: string) => Promise<string>;
  mintApiKey: (userId: string, permissions?: Record<string, string[]>) => Promise<string>;
  db: PrismaClient;
}

export const test = base.extend<Fixtures>({
  extraHTTPHeaders: async ({}, use) => {
    await use({ 'x-forwarded-for': fakeIp() });
  },
  lang: async ({}, use, testInfo) => {
    await use(testInfo.project.use.locale?.startsWith('fr') ? 'fr' : 'en');
  },
  t: async ({ lang }, use) => {
    await use((en, fr) => (lang === 'fr' ? fr : en));
  },
  db: async ({}, use) => {
    await use(db());
  },
  signIn: async ({ page, t }, use) => {
    await use(async (email = uniqueEmail()) => {
      await page.goto('/sign-in');
      await page.getByLabel(t('Email', 'E-mail')).fill(email);
      await page.getByRole('button', { name: t('Email me a code', 'Recevoir un code') }).click();
      const codeInput = page.getByRole('textbox', { name: t('6-digit code', 'Code à 6 chiffres') });
      await expect(codeInput).toBeVisible();
      await codeInput.fill(await issueCode(email));
      await expect(page).toHaveURL(/\/$/);
      return email;
    });
  },
  mintApiKey: async ({}, use) => {
    await use(async (userId, permissions) => {
      const created = await auth().api.createApiKey({
        body: { name: 'e2e', userId, ...(permissions ? { permissions } : {}) },
      });
      return created.key;
    });
  },
});

export { expect };
