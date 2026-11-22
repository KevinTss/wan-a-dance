import { render } from '@react-email/render';
import { createElement } from 'react';
import type { Locale } from '@wad/i18n';
import { consoleMailer } from './adapters/console.ts';
import { resendMailer } from './adapters/resend.ts';
import { OtpEmail, otpEmailSubject } from './templates/otp-email.tsx';
import type { Mailer } from './types.ts';

export type { Mailer, OutgoingEmail } from './types.ts';
export { OtpEmail } from './templates/otp-email.tsx';

export function createMailer(env: NodeJS.ProcessEnv = process.env): Mailer {
  const adapter = env['MAIL_ADAPTER'] ?? 'console';
  if (adapter === 'resend') {
    const apiKey = env['RESEND_API_KEY'];
    const from = env['MAIL_FROM'];
    if (!apiKey || !from)
      throw new Error('RESEND_API_KEY and MAIL_FROM are required for MAIL_ADAPTER=resend');
    return resendMailer(apiKey, from);
  }
  if (adapter === 'console') return consoleMailer();
  throw new Error(`Unknown MAIL_ADAPTER: ${adapter}`);
}

export async function sendOtpEmail(
  mailer: Mailer,
  input: { to: string; code: string; locale: Locale; minutes: number },
): Promise<void> {
  const element = createElement(OtpEmail, {
    code: input.code,
    locale: input.locale,
    minutes: input.minutes,
  });
  await mailer.send({
    to: input.to,
    subject: otpEmailSubject(input),
    html: await render(element),
    text: await render(element, { plainText: true }),
    tags: { type: 'otp' },
  });
}
