import type { Mailer } from '../types.ts';

export function consoleMailer(): Mailer {
  return {
    send(email) {
      console.warn(`\n📧 Email to ${email.to}\n   ${email.subject}\n`);
      return Promise.resolve();
    },
  };
}
