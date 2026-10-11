import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { createMiddleware } from 'hono/factory';
import type { Auth } from '@wad/auth';
import { permissionsToScopes, type ApiPermissions } from '@wad/auth/scopes';
import { AppError, ERROR_CODES } from '@wad/core';
import type { PrismaClient } from '@wad/db';
import type { ApiEnv } from './context.ts';
import { handleError, respondError } from './errors.ts';
import { errorResponses, okSchema } from './schemas.ts';

export interface CreateApiOptions {
  auth: Auth;
  db: PrismaClient;
  version: string;
  enabled: boolean;
  basePath?: string;
}

const BEARER = /^Bearer\s+(\S+)$/i;

export function createApi({ auth, db, version, enabled, basePath = '/api/v1' }: CreateApiOptions) {
  const app = new OpenAPIHono<ApiEnv>({
    defaultHook: (result, c) => {
      if (!result.success) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of result.error.issues) {
          const key = issue.path.join('.') || '_';
          (fieldErrors[key] ??= []).push(issue.message);
        }
        return respondError(c, ERROR_CODES.VALIDATION_FAILED, 'validation-failed', fieldErrors);
      }
      return undefined;
    },
  }).basePath(basePath);

  app.onError(handleError);
  app.notFound((c) => respondError(c, ERROR_CODES.NOT_FOUND));

  app.openapi(
    createRoute({
      method: 'get',
      path: '/health',
      tags: ['System'],
      summary: 'Health and version',
      responses: {
        200: {
          description: 'Service is up',
          content: {
            'application/json': {
              schema: okSchema(
                z.object({ status: z.literal('ok'), version: z.string() }),
                'Health',
              ),
            },
          },
        },
      },
    }),
    (c) => c.json({ ok: true as const, data: { status: 'ok' as const, version } }, 200),
  );

  const gate = createMiddleware<ApiEnv>(async (c, next) => {
    if (!enabled) return respondError(c, ERROR_CODES.NOT_FOUND);
    await next();
    return undefined;
  });

  const requireToken = createMiddleware<ApiEnv>(async (c, next) => {
    const key = BEARER.exec(c.req.header('authorization') ?? '')?.[1];
    if (!key) return respondError(c, ERROR_CODES.UNAUTHENTICATED, 'Missing bearer token');

    const result = await auth.api.verifyApiKey({ body: { key } });
    if (!result.valid || !result.key) {
      const rateLimited = result.error?.code === 'RATE_LIMITED';
      return respondError(
        c,
        rateLimited ? ERROR_CODES.RATE_LIMITED : ERROR_CODES.UNAUTHENTICATED,
        rateLimited ? 'rate-limited' : 'Invalid or expired token',
      );
    }

    c.set('ctx', {
      userId: result.key.referenceId,
      apiKeyId: result.key.id,
      scopes: permissionsToScopes(result.key.permissions as ApiPermissions | null),
      via: 'api',
      locale: 'en',
    });
    await next();
    return undefined;
  });

  app.use('/me', gate, requireToken);
  app.use('/workspaces/*', gate, requireToken);

  app.openapi(
    createRoute({
      method: 'get',
      path: '/me',
      tags: ['Account'],
      summary: 'The user that owns this API token',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Current user',
          content: {
            'application/json': {
              schema: okSchema(
                z.object({
                  id: z.string(),
                  email: z.string().nullable(),
                  name: z.string(),
                  scopes: z.array(z.string()),
                }),
                'Me',
              ),
            },
          },
        },
        ...errorResponses,
      },
    }),
    async (c) => {
      const ctx = c.get('ctx');
      const user = await db.user.findUnique({
        where: { id: ctx.userId },
        select: { id: true, email: true, name: true },
      });
      if (!user) throw new AppError(ERROR_CODES.UNAUTHENTICATED);
      return c.json({ ok: true as const, data: { ...user, scopes: [...ctx.scopes] } }, 200);
    },
  );

  app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    description: 'Personal API token (wad_…), created in Settings → API tokens.',
  });

  app.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'Wan a Dance API', version },
  });

  app.get('/docs', Scalar({ url: `${basePath}/openapi.json`, pageTitle: 'Wan a Dance API' }));

  return app;
}

export type Api = ReturnType<typeof createApi>;
