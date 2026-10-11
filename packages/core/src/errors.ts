export const ERROR_CODES = {
  UNAUTHENTICATED: 'unauthenticated',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not-found',
  VALIDATION_FAILED: 'validation-failed',
  CONFLICT: 'conflict',
  RATE_LIMITED: 'rate-limited',
  INTERNAL: 'internal-error',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const HTTP_STATUS: Record<ErrorCode, number> = {
  unauthenticated: 401,
  forbidden: 403,
  'not-found': 404,
  'validation-failed': 400,
  conflict: 409,
  'rate-limited': 429,
  'internal-error': 500,
};

export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fieldErrors: FieldErrors | undefined;

  constructor(code: ErrorCode, message: string = code, fieldErrors?: FieldErrors) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  get status(): number {
    return HTTP_STATUS[this.code];
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
