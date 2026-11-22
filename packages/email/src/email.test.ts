import { describe, expect, it, vi } from 'vitest';
import { createMailer, sendOtpEmail, type Mailer, type OutgoingEmail } from './index.ts';

function mockMailer() {
  const send = vi.fn<(email: OutgoingEmail) => Promise<void>>(() => Promise.resolve());
  const mailer: Mailer = { send };
  return { mailer, send };
}

describe('otp email', () => {
  it.each([
    ['en', '482913 is your Wan a Dance code', 'expires in 10 minutes'],
    ['fr', '482913 est votre code Wan a Dance', 'expire dans 10 minutes'],
  ] as const)('renders in %s', async (locale, subject, body) => {
    const { mailer, send } = mockMailer();
    await sendOtpEmail(mailer, { to: 'ana@school.com', code: '482913', locale, minutes: 10 });
    const email = send.mock.calls[0]?.[0];
    expect(email?.to).toBe('ana@school.com');
    expect(email?.subject).toBe(subject);
    expect(email?.text).toContain(body);
    expect(email?.html).toContain('482913');
    expect(email?.html).toContain(`lang="${locale}"`);
    expect(email?.tags).toEqual({ type: 'otp' });
  });
});

describe('createMailer', () => {
  it('logs emails to the console by default for local development', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await sendOtpEmail(createMailer({}), {
      to: 'a@b.co',
      code: '123456',
      locale: 'en',
      minutes: 10,
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('123456 is your Wan a Dance code'));
  });

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
