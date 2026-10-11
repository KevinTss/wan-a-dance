import { expect, test, uniqueEmail } from '../../src/fixtures/index.ts';

test.describe('Public API /api/v1', () => {
  test('health reports the deployed version', async ({ request }) => {
    const res = await request.get('/api/v1/health');
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({
      ok: true,
      data: { status: 'ok', version: expect.stringMatching(/^\d+\.\d+\.\d+/) },
    });
  });

  test('401 without a token', async ({ request }) => {
    const res = await request.get('/api/v1/me');
    expect(res.status()).toBe(401);
    expect(await res.json()).toMatchObject({ ok: false, code: 'unauthenticated' });
  });

  test('401 with an unknown token', async ({ request }) => {
    expect(
      (
        await request.get('/api/v1/me', { headers: { authorization: 'Bearer wad_unknown' } })
      ).status(),
    ).toBe(401);
  });

  test('a signed-in browser session cannot call the public API', async ({ page, signIn }) => {
    await signIn();
    const res = await page.request.get('/api/v1/me');
    expect(res.status()).toBe(401);
  });

  test('a valid token acts as its owner with its scopes', async ({ request, db, mintApiKey }) => {
    const email = uniqueEmail('api');
    const user = await db.user.create({
      data: { id: `user_${crypto.randomUUID()}`, email, name: 'API Owner', emailVerified: true },
    });
    const key = await mintApiKey(user.id, { members: ['read'] });
    const res = await request.get('/api/v1/me', { headers: { authorization: `Bearer ${key}` } });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      data: { id: user.id, email, name: 'API Owner', scopes: ['members:read'] },
    });
  });

  test('the OpenAPI document and docs are published', async ({ request }) => {
    const doc = (await (await request.get('/api/v1/openapi.json')).json()) as { openapi: string };
    expect(doc.openapi).toBe('3.1.0');
    expect((await request.get('/api/v1/docs')).headers()['content-type']).toContain('text/html');
  });

  test('auth endpoints reject cross-origin requests', async ({ request }) => {
    const res = await request.post('/api/auth/email-otp/send-verification-otp', {
      headers: { origin: 'https://evil.example.com', 'content-type': 'application/json' },
      data: { email: uniqueEmail(), type: 'sign-in' },
    });
    expect(res.status()).toBe(403);
  });
});
