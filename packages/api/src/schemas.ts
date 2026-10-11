import { z } from '@hono/zod-openapi';

export const ErrorSchema = z
  .object({
    ok: z.literal(false),
    code: z.enum([
      'unauthenticated',
      'forbidden',
      'not-found',
      'validation-failed',
      'conflict',
      'rate-limited',
      'internal-error',
    ]),
    message: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  })
  .openapi('Error');

export const errorResponses = {
  401: {
    description: 'Missing, invalid, expired or revoked API token',
    content: { 'application/json': { schema: ErrorSchema } },
  },
  403: {
    description: 'Token lacks the required scope or role',
    content: { 'application/json': { schema: ErrorSchema } },
  },
  429: {
    description: 'Rate limit exceeded for this token',
    content: { 'application/json': { schema: ErrorSchema } },
  },
} as const;

export function okSchema<T extends z.ZodType>(data: T, name: string) {
  return z.object({ ok: z.literal(true), data }).openapi(name);
}
