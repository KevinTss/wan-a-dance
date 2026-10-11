import { describe, expect, it } from 'vitest';
import {
  assertScope,
  assertWorkspaceAccess,
  canAccessWorkspace,
  hasScope,
  type Membership,
} from './index.ts';

const member = (overrides: Partial<Membership> = {}): Membership => ({
  memberId: 'member_1',
  workspaceId: 'workspace_1',
  roles: ['STUDENT'],
  status: 'ACTIVE',
  ...overrides,
});

describe('workspace access', () => {
  it.each([
    ['ACTIVE', true],
    ['TRIAL', true],
    ['LAPSED', true],
    ['LEAD', false],
    ['DEACTIVATED', false],
  ] as const)('student with status %s → %s', (status, expected) => {
    expect(canAccessWorkspace(member({ status }))).toBe(expected);
  });

  it('always lets staff in, whatever their member status', () => {
    expect(canAccessWorkspace(member({ roles: ['TEACHER'], status: 'LEAD' }))).toBe(true);
  });

  it('rejects missing membership', () => {
    expect(() => assertWorkspaceAccess(null)).toThrow(
      expect.objectContaining({ code: 'forbidden' }),
    );
  });

  it('enforces the allowed roles', () => {
    expect(() => assertWorkspaceAccess(member(), ['OWNER'])).toThrow(
      expect.objectContaining({ code: 'forbidden' }),
    );
    expect(assertWorkspaceAccess(member({ roles: ['OWNER'] }), ['OWNER']).memberId).toBe(
      'member_1',
    );
  });
});

describe('scopes', () => {
  it('lets session callers (no scopes) through', () => {
    expect(hasScope(undefined, 'members:write')).toBe(true);
  });

  it.each([
    [['members:read'], 'members:read', true],
    [['members:read'], 'members:write', false],
    [['members:*'], 'members:write', true],
    [['*'], 'events:write', true],
    [[], 'events:read', false],
  ])('scopes %j allow %s → %s', (scopes, required, expected) => {
    expect(hasScope(scopes, required)).toBe(expected);
  });

  it('throws forbidden when a scope is missing', () => {
    expect(() => assertScope(['members:read'], 'members:write')).toThrow(/Missing scope/);
  });
});
