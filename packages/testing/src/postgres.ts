import type {} from 'vitest';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import pg from 'pg';

const TEMPLATE_DB = 'wad_template';
const require = createRequire(import.meta.url);
const dbPackageDir = dirname(require.resolve('@wad/db/package.json'));

export function withDatabase(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

async function admin<T>(serverUrl: string, run: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: withDatabase(serverUrl, 'postgres') });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

export async function createTemplate(serverUrl: string): Promise<void> {
  await admin(serverUrl, async (client) => {
    await client.query(`DROP DATABASE IF EXISTS ${TEMPLATE_DB} WITH (FORCE)`);
    await client.query(`CREATE DATABASE ${TEMPLATE_DB}`);
  });
  execFileSync(join(dbPackageDir, 'node_modules', '.bin', 'prisma'), ['migrate', 'deploy'], {
    cwd: dbPackageDir,
    env: { ...process.env, DATABASE_URL: withDatabase(serverUrl, TEMPLATE_DB) },
    stdio: 'pipe',
  });
}

export async function cloneTemplate(serverUrl: string, name: string): Promise<string> {
  const safe = name.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
  await admin(serverUrl, async (client) => {
    await client.query(`DROP DATABASE IF EXISTS ${safe} WITH (FORCE)`);
    await client.query(`CREATE DATABASE ${safe} TEMPLATE ${TEMPLATE_DB}`);
  });
  return withDatabase(serverUrl, safe);
}

export async function dropDatabase(serverUrl: string, name: string): Promise<void> {
  await admin(serverUrl, async (client) => {
    await client.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
  });
}

export async function truncateAll(url: string): Promise<void> {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const { rows } = await client.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`,
    );
    if (rows.length > 0) {
      await client.query(
        `TRUNCATE ${rows.map((row) => `"${row.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`,
      );
    }
  } finally {
    await client.end();
  }
}

declare module 'vitest' {
  export interface ProvidedContext {
    pgServerUrl: string;
  }
}
