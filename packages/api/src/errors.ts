import type { Context } from 'hono';
import { AppError, ERROR_CODES, HTTP_STATUS, type ErrorCode, type FieldErrors } from '@wad/core';

export function errorBody(code: ErrorCode, message: string = code, fieldErrors?: FieldErrors) {
  return fieldErrors
    ? { ok: false as const, code, message, fieldErrors }
    : { ok: false as const, code, message };
}

export function respondError(
  c: Context,
  code: ErrorCode,
  message?: string,
  fieldErrors?: FieldErrors,
) {
  return c.json(errorBody(code, message, fieldErrors), HTTP_STATUS[code] as 400);
}

export function handleError(error: unknown, c: Context) {
  if (error instanceof AppError)
    return respondError(c, error.code, error.message, error.fieldErrors);
  console.error(error);
  return respondError(c, ERROR_CODES.INTERNAL);
}
