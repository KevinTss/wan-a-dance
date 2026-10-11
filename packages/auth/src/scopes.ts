export const API_RESOURCES = ['workspaces', 'members', 'events', 'attendance', 'credits'] as const;
export type ApiResource = (typeof API_RESOURCES)[number];
export type ApiAction = 'read' | 'write';
export type ApiPermissions = Partial<Record<ApiResource, ApiAction[]>>;

export function permissionsToScopes(permissions: ApiPermissions | null | undefined): string[] {
  if (!permissions) return [];
  return Object.entries(permissions).flatMap(([resource, actions]) =>
    actions.map((action) => `${resource}:${action}`),
  );
}
