import { describe, expect, it } from 'vitest';
import {
  AppError,
  createEventBus,
  err,
  generateId,
  ID_PREFIXES,
  isAppError,
  isValidId,
  ok,
  requireAuthed,
  systemCtx,
  toErr,
} from './index.ts';

describe('ids', () => {
  it('generates prefixed v4 ids that validate', () => {
    const id = generateId(ID_PREFIXES.MEMBER);
    expect(id).toMatch(/^member_[0-9a-f-]{36}$/);
    expect(isValidId(id, ID_PREFIXES.MEMBER)).toBe(true);
  });

  it.each(['member_123', 'workspace_00000000-0000-4000-8000-000000000000', 'nounderscore', ''])(
    'rejects %s as a member id',
    (id) => {
      expect(isValidId(id, ID_PREFIXES.MEMBER)).toBe(false);
    },
  );
});

describe('errors and results', () => {
  it('maps codes to http status', () => {
    expect(new AppError('not-found').status).toBe(404);
    expect(new AppError('validation-failed').status).toBe(400);
  });

  it('wraps values and errors', () => {
    expect(ok(1)).toEqual({ ok: true, data: 1 });
    expect(err('conflict', 'taken', { slug: ['taken'] })).toEqual({
      ok: false,
      code: 'conflict',
      message: 'taken',
      fieldErrors: { slug: ['taken'] },
    });
  });

  it('never leaks unknown error details', () => {
    expect(toErr(new Error('db password is hunter2'))).toEqual({
      ok: false,
      code: 'internal-error',
      message: 'internal-error',
    });
    expect(toErr(new AppError('forbidden'))).toMatchObject({ code: 'forbidden' });
    expect(isAppError(new AppError('conflict'))).toBe(true);
  });
});

describe('ctx', () => {
  it('requires a user', () => {
    expect(() => requireAuthed(systemCtx())).toThrow(
      expect.objectContaining({ code: 'unauthenticated' }),
    );
    expect(requireAuthed({ userId: 'user_1', via: 'web', locale: 'en' }).userId).toBe('user_1');
  });
});

describe('event bus', () => {
  it('delivers to subscribers until unsubscribed', async () => {
    const bus = createEventBus();
    const seen: string[] = [];
    const off = bus.on('user.created', ({ userId }) => {
      seen.push(userId);
    });
    await bus.emit('user.created', { userId: 'user_1' });
    off();
    await bus.emit('user.created', { userId: 'user_2' });
    expect(seen).toEqual(['user_1']);
  });
});
