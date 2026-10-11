import { AppError, ERROR_CODES } from '../errors.ts';

export const ROLES = ['OWNER', 'TEACHER', 'STUDENT'] as const;
export type Role = (typeof ROLES)[number];

export const MEMBER_STATUSES = ['LEAD', 'TRIAL', 'ACTIVE', 'LAPSED', 'DEACTIVATED'] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const STAFF_ROLES: readonly Role[] = ['OWNER', 'TEACHER'];

const STATUSES_WITH_ACCESS: readonly MemberStatus[] = ['TRIAL', 'ACTIVE', 'LAPSED'];

export interface Membership {
  memberId: string;
  workspaceId: string;
  roles: readonly Role[];
  status: MemberStatus;
}

export function hasAnyRole(membership: Membership, allowed: readonly Role[]): boolean {
  return membership.roles.some((role) => allowed.includes(role));
}

export function canAccessWorkspace(membership: Membership): boolean {
  return hasAnyRole(membership, STAFF_ROLES) || STATUSES_WITH_ACCESS.includes(membership.status);
}

export function assertWorkspaceAccess(
  membership: Membership | null,
  allowed: readonly Role[] = ROLES,
): Membership {
  if (!membership || !canAccessWorkspace(membership)) throw new AppError(ERROR_CODES.FORBIDDEN);
  if (!hasAnyRole(membership, allowed)) throw new AppError(ERROR_CODES.FORBIDDEN);
  return membership;
}

export function hasScope(scopes: readonly string[] | undefined, required: string): boolean {
  if (scopes === undefined) return true;
  const [resource] = required.split(':');
  return (
    scopes.includes(required) || scopes.includes(`${resource ?? ''}:*`) || scopes.includes('*')
  );
}

export function assertScope(scopes: readonly string[] | undefined, required: string): void {
  if (!hasScope(scopes, required))
    throw new AppError(ERROR_CODES.FORBIDDEN, `Missing scope ${required}`);
}
