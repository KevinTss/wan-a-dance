import { afterAll, beforeAll, beforeEach, describe, expect, inject, it } from 'vitest';
import { createAuth, type Auth } from '@wad/auth';
import { createDb, type PrismaClient } from '@wad/db/client';
import { cloneTemplate, createUser, dropDatabase, truncateAll } from '@wad/testing';
import { createApi, type Api } from './index.ts';

const dbName = `wad_api_${process.pid}`;
let url: string;
let db: PrismaClient;
let auth: Auth;
let api: Api;

const get = (app: Api, path: string, headers: Record<string, string> = {}) =>
  app.request(`/api/v1${path}`, { headers });

async function mintKey(userId: string, body: Record<string, unknown> = {}) {
  return auth.api.createApiKey({ body: { name: 'test', userId, ...body } });
}

beforeAll(async () => {
  url = await cloneTemplate(inject('pgServerUrl'), dbName);
  db = createDb(url);
  auth = createAuth({
    db,
    secret: 'test-secret-test-secret-test-secret-123',
    baseURL: 'http://localhost:3000',
    mailer: { send: () => Promise.resolve() },
    rateLimitEnabled: false,
  });
  api = createApi({ auth, db, version: '0.0.0-test', enabled: true });
});

beforeEach(async () => {
  await truncateAll(url);
});

afterAll(async () => {
  await db.$disconnect();
  await dropDatabase(inject('pgServerUrl'), dbName);
});

describe('health', () => {
  it('reports status and version without auth', async () => {
    const res = await get(api, '/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, data: { status: 'ok', version: '0.0.0-test' } });
  });
});

describe('public API gate', () => {
  it('returns 404 for every protected route while disabled, but keeps health up', async () => {
    const disabled = createApi({ auth, db, version: '0.0.0-test', enabled: false });
    const user = await createUser(db);
    const { key } = await mintKey(user.id);
    expect((await get(disabled, '/me', { authorization: `Bearer ${key}` })).status).toBe(404);
    expect((await get(disabled, '/health')).status).toBe(200);
  });
});

describe('token authentication', () => {
  it('401 without a token', async () => {
    const res = await get(api, '/me');
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ ok: false, code: 'unauthenticated' });
  });

  it('401 with a malformed or unknown token', async () => {
    expect((await get(api, '/me', { authorization: 'Bearer wad_nope' })).status).toBe(401);
    expect((await get(api, '/me', { authorization: 'Basic abc' })).status).toBe(401);
  });

  it('ignores session cookies entirely', async () => {
    const res = await get(api, '/me', { cookie: 'wad.session_token=anything' });
    expect(res.status).toBe(401);
  });

  it('401 with an expired token', async () => {
    const user = await createUser(db);
    const created = await mintKey(user.id);
    await db.apiKey.update({
      where: { id: created.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect((await get(api, '/me', { authorization: `Bearer ${created.key}` })).status).toBe(401);
  });

  it('401 with a revoked token', async () => {
    const user = await createUser(db);
    const created = await mintKey(user.id);
    await db.apiKey.delete({ where: { id: created.id } });
    expect((await get(api, '/me', { authorization: `Bearer ${created.key}` })).status).toBe(401);
  });

  it('200 with a valid token, acting as its owner with its scopes', async () => {
    const user = await createUser(db, { email: 'owner@school.com', name: 'Owner' });
    const { key } = await mintKey(user.id, { permissions: { members: ['read', 'write'] } });
    const res = await get(api, '/me', { authorization: `Bearer ${key}` });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      data: {
        id: user.id,
        email: 'owner@school.com',
        name: 'Owner',
        scopes: ['members:read', 'members:write'],
      },
    });
  });

  it('429 once the per-token rate limit is exceeded', async () => {
    const user = await createUser(db);
    const { key } = await mintKey(user.id, {
      rateLimitEnabled: true,
      rateLimitMax: 2,
      rateLimitTimeWindow: 60_000,
    });
    const headers = { authorization: `Bearer ${key}` };
    expect((await get(api, '/me', headers)).status).toBe(200);
    expect((await get(api, '/me', headers)).status).toBe(200);
    const limited = await get(api, '/me', headers);
    expect(limited.status).toBe(429);
    expect(await limited.json()).toMatchObject({ code: 'rate-limited' });
  });
});

describe('contract', () => {
  it('returns a JSON 404 envelope for unknown routes', async () => {
    const res = await get(api, '/does-not-exist');
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ ok: false, code: 'not-found' });
  });

  it('publishes an OpenAPI 3.1 document describing every route', async () => {
    const res = await get(api, '/openapi.json');
    const doc = (await res.json()) as {
      openapi: string;
      paths: Record<string, unknown>;
      components: { securitySchemes: Record<string, unknown> };
    };
    expect(doc.openapi).toBe('3.1.0');
    expect(Object.keys(doc.paths).sort()).toEqual(['/api/v1/health', '/api/v1/me']);
    expect(doc.components.securitySchemes).toHaveProperty('bearerAuth');
  });

  it('serves human-readable docs', async () => {
    const res = await get(api, '/docs');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });
});
