import { AppError, ERROR_CODES } from './errors.ts';

export type Via = 'web' | 'api' | 'mcp' | 'cron' | 'system';

export interface Ctx {
  userId: string | null;
  via: Via;
  locale: string;
  apiKeyId?: string;
  scopes?: readonly string[];
}

export interface AuthedCtx extends Ctx {
  userId: string;
}

export function requireAuthed(ctx: Ctx): AuthedCtx {
  if (!ctx.userId) throw new AppError(ERROR_CODES.UNAUTHENTICATED);
  return ctx as AuthedCtx;
}

export function systemCtx(via: Extract<Via, 'cron' | 'system'> = 'system'): Ctx {
  return { userId: null, via, locale: 'en' };
}
