import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Mailer, OutgoingEmail } from '../types.ts';

export interface CapturedEmail extends OutgoingEmail {
  sentAt: string;
}

export function defaultCaptureDir(): string {
  return (
    process.env['MAIL_CAPTURE_DIR'] ?? join(/* turbopackIgnore: true */ process.cwd(), '.mailbox')
  );
}

export function captureMailer(dir = defaultCaptureDir()): Mailer {
  return {
    async send(email) {
      await mkdir(dir, { recursive: true });
      const sentAt = new Date().toISOString();
      const file = `${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}.json`;
      await writeFile(
        join(dir, file),
        JSON.stringify({ ...email, sentAt } satisfies CapturedEmail),
      );
    },
  };
}

export async function readMailbox(dir = defaultCaptureDir()): Promise<CapturedEmail[]> {
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return [];
  }
  const emails = await Promise.all(
    files
      .filter((file) => file.endsWith('.json'))
      .map(async (file) => JSON.parse(await readFile(join(dir, file), 'utf8')) as CapturedEmail),
  );
  return emails.sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}

export async function latestEmailTo(
  to: string,
  dir = defaultCaptureDir(),
): Promise<CapturedEmail | undefined> {
  const emails = await readMailbox(dir);
  return emails.filter((email) => email.to.toLowerCase() === to.toLowerCase()).at(-1);
}

export async function clearMailbox(dir = defaultCaptureDir()): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}
