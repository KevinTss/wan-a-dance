import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Page } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { createAuth } from '@wad/auth';
import { createDb, type PrismaClient } from '@wad/db/client';
import { captureMailer, latestEmailTo } from '@wad/email/capture';
import { BASE_URL, MAILBOX_DIR, e2eDatabaseUrl } from '../env.ts';

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

export async function waitForCode(email: string, after = 0): Promise<string> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const message = await latestEmailTo(email, MAILBOX_DIR);
    if (message && Date.parse(message.sentAt) >= after) {
      const code = /\b(\d{6})\b/.exec(message.subject)?.[1];
      if (code) return code;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`No sign-in code emailed to ${email}`);
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
      const requestedAt = Date.now() - 1000;
      await page.getByRole('button', { name: t('Email me a code', 'Recevoir un code') }).click();
      const code = await waitForCode(email, requestedAt);
      await page.getByRole('textbox', { name: t('6-digit code', 'Code à 6 chiffres') }).fill(code);
      await expect(page).toHaveURL(/\/$/);
      return email;
    });
  },
  mintApiKey: async ({}, use) => {
    const auth = createAuth({
      db: db(),
      secret: 'e2e-secret-e2e-secret-e2e-secret-0000',
      baseURL: BASE_URL,
      mailer: captureMailer(MAILBOX_DIR),
    });
    await use(async (userId, permissions) => {
      const created = await auth.api.createApiKey({
        body: { name: 'e2e', userId, ...(permissions ? { permissions } : {}) },
      });
      return created.key;
    });
  },
});

export { expect };
