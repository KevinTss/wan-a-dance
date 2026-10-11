---
name: migrate-domain
description: Port a domain module from the legacy NestJS API (../api/src/<module>) into packages/core with full test parity. Use when migrating members, events, credits, invitations or another legacy module.
---

1. Read the legacy module: `../api/src/<module>/{*.service.ts,*.controller.ts,dto/*,README.md,*.e2e.spec.ts}` and `docs/domain/*`.
2. List every legacy endpoint and e2e case in `docs/migration/parity.md` with its target (core function, `/api/v1` route, UI story) and status.
3. Port behaviour, not structure: DTOs → Zod schemas, guards → `assertWorkspaceAccess`/`assertScope`, `buildResponse` → `Result`/AppError, EventEmitter2 → `events`.
4. Port each legacy e2e case as an integration test first (red), then implement (green). Keep prefixed IDs and table names.
5. Only port what the current release's stories need; mark the rest `deferred (<release>)` in the parity table.
6. Write `packages/core/src/<domain>/README.md`: entities, state machine, permissions matrix, invariants.
7. Then continue with the `new-feature` skill for API, web and e2e.
