export const E2E_PORT = Number(process.env['E2E_PORT'] ?? 3200);
export const BASE_URL = process.env['E2E_BASE_URL'] ?? `http://localhost:${String(E2E_PORT)}`;
export const PG_SERVER_URL =
  process.env['TEST_PG_SERVER_URL'] ?? 'postgresql://wad:wad@localhost:5433/postgres';
export const E2E_DB_NAME = 'wad_e2e';

export function e2eDatabaseUrl(): string {
  const url = new URL(PG_SERVER_URL);
  url.pathname = `/${E2E_DB_NAME}`;
  return url.toString();
}
