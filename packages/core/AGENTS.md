# packages/core — domain rules

- One folder per domain: `<domain>/{<domain>.service.ts, <domain>.schemas.ts, <domain>.service.test.ts, README.md}`.
- Services are plain functions `(ctx, input, deps?)`. No classes, no DI container, no `next/*`, no React.
- Validate input with the Zod schema from `<domain>.schemas.ts`; the same schema feeds actions, `/api/v1` and forms.
- Authorize first: `assertWorkspaceAccess(membership, roles)` and `assertScope(ctx.scopes, 'resource:action')` for API calls.
- Throw `AppError(code)`; never return raw Prisma errors. Codes live in `src/errors.ts` (kebab-case).
- Each state change: one `db.$transaction`, then `events.emit('resource.action', …)`.
- IDs: `generateId(ID_PREFIXES.X)`. Add new prefixes to `src/ids.ts`.
- Money: `Money` from `./money` (minor units + currency). Never floats, never mixed currencies.
- Dates: store UTC; format with the workspace timezone in the UI.
- Tests: integration tests with `@wad/testing` (real Postgres, factories). Cover happy path, validation, authz denial, conflicts. Title with story IDs.
- Coverage gate: 90% lines/branches. Update the domain `README.md` with any rule change (CI checks it).
