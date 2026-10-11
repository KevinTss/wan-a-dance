import { cloneTemplate, createTemplate } from '@wad/testing/postgres';
import { clearMailbox } from '@wad/email/capture';
import { E2E_DB_NAME, MAILBOX_DIR, PG_SERVER_URL } from '../src/env.ts';

await createTemplate(PG_SERVER_URL);
await cloneTemplate(PG_SERVER_URL, E2E_DB_NAME);
await clearMailbox(MAILBOX_DIR);
console.warn(`e2e database ready: ${E2E_DB_NAME}`);
