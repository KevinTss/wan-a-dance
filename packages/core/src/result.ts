import { AppError, ERROR_CODES, type ErrorCode, type FieldErrors } from './errors.ts';

export type Ok<T> = { ok: true; data: T };
export type Err = { ok: false; code: ErrorCode; message: string; fieldErrors?: FieldErrors };
export type Result<T> = Ok<T> | Err;

export function ok<T>(data: T): Ok<T> {
  return { ok: true, data };
}

export function err(code: ErrorCode, message: string = code, fieldErrors?: FieldErrors): Err {
  return fieldErrors ? { ok: false, code, message, fieldErrors } : { ok: false, code, message };
}

export function toErr(error: unknown): Err {
  if (error instanceof AppError) return err(error.code, error.message, error.fieldErrors);
  return err(ERROR_CODES.INTERNAL);
}
