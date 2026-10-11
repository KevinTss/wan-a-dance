import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { createTemplate } from './postgres.ts';

let container: StartedPostgreSqlContainer | undefined;

export async function startPostgres(): Promise<string> {
  const existing = process.env['TEST_PG_SERVER_URL'];
  if (existing) return existing;
  container = await new PostgreSqlContainer('postgres:17-alpine')
    .withTmpFs({ '/var/lib/postgresql/data': 'rw' })
    .start();
  return container.getConnectionUri();
}

export async function stopPostgres(): Promise<void> {
  await container?.stop();
}

export default async function setup({
  provide,
}: {
  provide: (key: 'pgServerUrl', value: string) => void;
}) {
  const serverUrl = await startPostgres();
  await createTemplate(serverUrl);
  provide('pgServerUrl', serverUrl);
  return stopPostgres;
}
