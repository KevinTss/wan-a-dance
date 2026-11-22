import { afterAll, beforeAll, beforeEach, describe, expect, inject, it, vi } from 'vitest';
import { isValidId, ID_PREFIXES } from '@wad/core';
import { createDb, type PrismaClient } from '@wad/db/client';
import type { Mailer, OutgoingEmail } from '@wad/email';
import { cloneTemplate, createUser, dropDatabase, truncateAll } from '@wad/testing';
import { createAuth, type Auth } from './index.ts';

const dbName = `wad_auth_${process.pid}`;
let url: string;
let db: PrismaClient;
let auth: Auth;
const send = vi.fn<(email: OutgoingEmail) => Promise<void>>(() => Promise.resolve());
const mailer: Mailer = { send };

function lastEmailTo(email: string): OutgoingEmail | undefined {
  return send.mock.calls
    .map(([sent]) => sent)
    .filter((sent) => sent.to === email)
    .at(-1);
}

function codeFor(email: string): string {
  const message = lastEmailTo(email);
  const code = /\b(\d{6})\b/.exec(message?.subject ?? '')?.[1];
  if (!code) throw new Error(`No code emailed to ${email}`);
  return code;
}

beforeAll(async () => {
  url = await cloneTemplate(inject('pgServerUrl'), dbName);
  db = createDb(url);
  auth = createAuth({
    db,
    secret: 'test-secret-test-secret-test-secret-123',
    baseURL: 'http://localhost:3000',
    mailer,
    rateLimitEnabled: false,
  });
});

beforeEach(async () => {
  await truncateAll(url);
  send.mockClear();
});

afterAll(async () => {
  await db.$disconnect();
  await dropDatabase(inject('pgServerUrl'), dbName);
});

describe('[R1-ACC-01] email code sign-in', () => {
  it('signs up a new user with a 6-digit emailed code', async () => {
    await auth.api.sendVerificationOTP({ body: { email: 'Ana@School.com', type: 'sign-in' } });
    const code = codeFor('ana@school.com');
    expect(code).toMatch(/^\d{6}$/);

    const result = await auth.api.signInEmailOTP({ body: { email: 'ana@school.com', otp: code } });
    expect(result.token).toBeTruthy();
    expect(isValidId(result.user.id, ID_PREFIXES.USER)).toBe(true);

    const user = await db.user.findUniqueOrThrow({ where: { email: 'ana@school.com' } });
    expect(user.emailVerified).toBe(true);
    expect(await db.authSession.count({ where: { userId: user.id } })).toBe(1);
  });

  it('stores the code hashed, never in plain text', async () => {
    await auth.api.sendVerificationOTP({ body: { email: 'ana@school.com', type: 'sign-in' } });
    const code = codeFor('ana@school.com');
    const rows = await db.authVerification.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.value).not.toContain(code);
  });

  it('emails the code in the language of the request', async () => {
    await auth.api.sendVerificationOTP({
      body: { email: 'ana@school.com', type: 'sign-in' },
      headers: new Headers({ 'accept-language': 'fr-BE,fr;q=0.9' }),
    });
    expect(lastEmailTo('ana@school.com')?.subject).toContain('est votre code');
  });
});

describe('[R1-ACC-02] wrong or expired code', () => {
  it('rejects a wrong code', async () => {
    await auth.api.sendVerificationOTP({ body: { email: 'ana@school.com', type: 'sign-in' } });
    await expect(
      auth.api.signInEmailOTP({ body: { email: 'ana@school.com', otp: '000000' } }),
    ).rejects.toThrow();
    expect(await db.authSession.count()).toBe(0);
  });

  it('locks the code after too many attempts, even if the right code comes later', async () => {
    await auth.api.sendVerificationOTP({ body: { email: 'ana@school.com', type: 'sign-in' } });
    const code = codeFor('ana@school.com');
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        auth.api.signInEmailOTP({ body: { email: 'ana@school.com', otp: '000000' } }),
      ).rejects.toThrow();
    }
    await expect(
      auth.api.signInEmailOTP({ body: { email: 'ana@school.com', otp: code } }),
    ).rejects.toThrow();
  });

  it('rejects a code after it has been used once', async () => {
    await auth.api.sendVerificationOTP({ body: { email: 'ana@school.com', type: 'sign-in' } });
    const code = codeFor('ana@school.com');
    await auth.api.signInEmailOTP({ body: { email: 'ana@school.com', otp: code } });
    await expect(
      auth.api.signInEmailOTP({ body: { email: 'ana@school.com', otp: code } }),
    ).rejects.toThrow();
  });

  it('rejects an expired code', async () => {
    await auth.api.sendVerificationOTP({ body: { email: 'ana@school.com', type: 'sign-in' } });
    const code = codeFor('ana@school.com');
    await db.authVerification.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    await expect(
      auth.api.signInEmailOTP({ body: { email: 'ana@school.com', otp: code } }),
    ).rejects.toThrow();
  });
});

describe('[R1-ACC-05] existing users', () => {
  it('signs an existing (migrated) user into the same account', async () => {
    const existing = await createUser(db, { email: 'legacy@school.com' });
    await auth.api.sendVerificationOTP({ body: { email: 'legacy@school.com', type: 'sign-in' } });
    const result = await auth.api.signInEmailOTP({
      body: { email: 'legacy@school.com', otp: codeFor('legacy@school.com') },
    });
    expect(result.user.id).toBe(existing.id);
    expect(await db.user.count()).toBe(1);
  });
});

describe('API keys (used by API e2e from R1, managed by users in R4)', () => {
  it('creates a hashed, prefixed key that verifies with its permissions', async () => {
    const user = await createUser(db);
    const created = await auth.api.createApiKey({
      body: { name: 'ci', userId: user.id, permissions: { members: ['read'] } },
    });
    expect(created.key.startsWith('wad_')).toBe(true);

    const stored = await db.apiKey.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.key).not.toBe(created.key);
    expect(isValidId(stored.id, ID_PREFIXES.API_KEY)).toBe(true);

    const valid = await auth.api.verifyApiKey({
      body: { key: created.key, permissions: { members: ['read'] } },
    });
    expect(valid.valid).toBe(true);

    const missing = await auth.api.verifyApiKey({
      body: { key: created.key, permissions: { members: ['write'] } },
    });
    expect(missing.valid).toBe(false);
  });

  it('stops working once revoked or expired', async () => {
    const user = await createUser(db);
    const created = await auth.api.createApiKey({ body: { name: 'ci', userId: user.id } });
    await db.apiKey.update({
      where: { id: created.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect((await auth.api.verifyApiKey({ body: { key: created.key } })).valid).toBe(false);

    const second = await auth.api.createApiKey({ body: { name: 'ci2', userId: user.id } });
    await db.apiKey.delete({ where: { id: second.id } });
    expect((await auth.api.verifyApiKey({ body: { key: second.key } })).valid).toBe(false);
  });

  it('rejects garbage keys', async () => {
    expect((await auth.api.verifyApiKey({ body: { key: 'wad_not-a-real-key' } })).valid).toBe(
      false,
    );
  });
});

describe('[R1-ACC-02] rate limiting', () => {
  it('blocks a 4th code request for the same client within a minute', async () => {
    const limited = createAuth({
      db,
      secret: 'test-secret-test-secret-test-secret-123',
      baseURL: 'http://localhost:3000',
      mailer,
      rateLimitEnabled: true,
    });
    const send = () =>
      limited.handler(
        new Request('http://localhost:3000/api/auth/email-otp/send-verification-otp', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            origin: 'http://localhost:3000',
            'x-forwarded-for': '203.0.113.7',
          },
          body: JSON.stringify({ email: 'ana@school.com', type: 'sign-in' }),
        }),
      );
    for (let attempt = 0; attempt < 3; attempt += 1) expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(429);
    expect(await db.authRateLimit.count()).toBeGreaterThan(0);
  });
});
