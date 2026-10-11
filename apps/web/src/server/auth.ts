import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { nextCookies } from 'better-auth/next-js';
import { cache } from 'react';
import { createAuth } from '@wad/auth';
import { getDb } from '@wad/db/client';
import { env } from './env.ts';

export const auth = createAuth({
  db: getDb(),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  plugins: [nextCookies()],
});

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  return session;
}
