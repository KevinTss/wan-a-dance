import type { Ctx } from '@wad/core';

export interface ApiEnv {
  Variables: { ctx: Ctx & { userId: string; apiKeyId: string; scopes: readonly string[] } };
}
