import { createApi } from '@wad/api';
import { getDb } from '@wad/db/client';
import { auth } from '@/server/auth';
import { env } from '@/server/env';

const api = createApi({
  auth,
  db: getDb(),
  version: env.NEXT_PUBLIC_APP_VERSION,
  enabled: env.PUBLIC_API_ENABLED,
});

const handler = (request: Request) => api.fetch(request);

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
