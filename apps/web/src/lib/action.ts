import 'server-only';
import { headers } from 'next/headers';
import type { z } from 'zod';
import { AppError, ERROR_CODES, err, ok, toErr, type AuthedCtx, type Result } from '@wad/core';
import { resolveLocale } from '@wad/i18n';
import { auth } from '@/server/auth';

export function createAction<Schema extends z.ZodType, Output>(
  schema: Schema,
  handler: (ctx: AuthedCtx, input: z.infer<Schema>) => Promise<Output>,
) {
  return async (raw: unknown): Promise<Result<Output>> => {
    try {
      const requestHeaders = await headers();
      const session = await auth.api.getSession({ headers: requestHeaders });
      if (!session) throw new AppError(ERROR_CODES.UNAUTHENTICATED);

      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of parsed.error.issues)
          (fieldErrors[issue.path.join('.') || '_'] ??= []).push(issue.message);
        return err(ERROR_CODES.VALIDATION_FAILED, 'validation-failed', fieldErrors);
      }

      const ctx: AuthedCtx = {
        userId: session.user.id,
        via: 'web',
        locale: resolveLocale([
          (session.user as { locale?: string | null }).locale,
          requestHeaders.get('accept-language'),
        ]),
      };
      return ok(await handler(ctx, parsed.data));
    } catch (error) {
      if (!(error instanceof AppError)) console.error(error);
      return toErr(error);
    }
  };
}
