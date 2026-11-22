import 'server-only';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  MAIL_ADAPTER: z.enum(['resend', 'console']).default('console'),
  PUBLIC_API_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('0.0.0'),
});

const vercelUrl =
  process.env['VERCEL_ENV'] === 'preview' && process.env['VERCEL_URL']
    ? `https://${process.env['VERCEL_URL']}`
    : undefined;

export const env = schema.parse({
  ...process.env,
  BETTER_AUTH_URL: process.env['BETTER_AUTH_URL'] ?? vercelUrl,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
});
