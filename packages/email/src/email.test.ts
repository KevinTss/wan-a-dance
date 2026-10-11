import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { captureMailer, clearMailbox, latestEmailTo, readMailbox } from './adapters/capture.ts';
import { createMailer, sendOtpEmail } from './index.ts';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'wad-mail-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('otp email', () => {
  it.each([
    ['en', '482913 is your Wan a Dance code', 'expires in 10 minutes'],
    ['fr', '482913 est votre code Wan a Dance', 'expire dans 10 minutes'],
  ] as const)('renders in %s', async (locale, subject, body) => {
    await sendOtpEmail(captureMailer(dir), {
      to: 'Ana@School.com',
      code: '482913',
      locale,
      minutes: 10,
    });
    const email = await latestEmailTo('ana@school.com', dir);
    expect(email?.subject).toBe(subject);
    expect(email?.text).toContain(body);
    expect(email?.html).toContain('482913');
    expect(email?.html).toContain(`lang="${locale}"`);
  });

  it('keeps emails in order and can be cleared', async () => {
    const mailer = captureMailer(dir);
    await sendOtpEmail(mailer, { to: 'a@b.co', code: '111111', locale: 'en', minutes: 10 });
    await sendOtpEmail(mailer, { to: 'a@b.co', code: '222222', locale: 'en', minutes: 10 });
    expect((await latestEmailTo('a@b.co', dir))?.subject).toContain('222222');
    expect(await readMailbox(dir)).toHaveLength(2);
    await clearMailbox(dir);
    expect(await readMailbox(dir)).toEqual([]);
  });
});

describe('createMailer', () => {
  it('requires resend credentials', () => {
    expect(() => createMailer({ MAIL_ADAPTER: 'resend' })).toThrow(/RESEND_API_KEY/);
  });

  it('rejects unknown adapters', () => {
    expect(() => createMailer({ MAIL_ADAPTER: 'smtp' })).toThrow(/Unknown MAIL_ADAPTER/);
  });

  it('builds the resend adapter when configured', () => {
    expect(
      createMailer({ MAIL_ADAPTER: 'resend', RESEND_API_KEY: 're_test', MAIL_FROM: 'x@y.z' }),
    ).toHaveProperty('send');
  });
});
