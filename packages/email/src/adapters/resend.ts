import { Resend } from 'resend';
import type { Mailer } from '../types.ts';

export function resendMailer(apiKey: string, from: string): Mailer {
  const client = new Resend(apiKey);
  return {
    async send(email) {
      const { error } = await client.emails.send({
        from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        tags: Object.entries(email.tags ?? {}).map(([name, value]) => ({ name, value })),
      });
      if (error) throw new Error(`Resend failed: ${error.name}`);
    },
  };
}
