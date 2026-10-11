import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.ts';

export type { PrismaClient } from './generated/prisma/client.ts';

export function createDb(connectionString = process.env['DATABASE_URL']): PrismaClient {
  if (!connectionString) throw new Error('DATABASE_URL is required');
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

const globalForDb = globalThis as unknown as { wadDb?: PrismaClient };

export function getDb(): PrismaClient {
  globalForDb.wadDb ??= createDb();
  return globalForDb.wadDb;
}
