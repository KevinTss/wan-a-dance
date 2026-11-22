import { cloneTemplate, createTemplate } from '@wad/testing/postgres';
import { E2E_DB_NAME, PG_SERVER_URL } from '../src/env.ts';

await createTemplate(PG_SERVER_URL);
await cloneTemplate(PG_SERVER_URL, E2E_DB_NAME);
console.warn(`e2e database ready: ${E2E_DB_NAME}`);
