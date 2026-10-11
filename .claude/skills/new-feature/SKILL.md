---
name: new-feature
description: Implement a user story end to end (core service, API endpoint, server action, UI, stories, e2e) in the Wan a Dance monorepo. Use when starting work on a story ID like R1-MEM-03.
---

Input: a story ID from `docs/product/IMPLEMENTATION_PLAN.md` and its Jira key.

1. Read the story, `packages/core/src/<domain>/README.md` (create it if new), and the matching `docs/domain/*` doc. Check `docs/migration/parity.md` for the old NestJS behaviour and e2e cases.
2. **Schema** (if needed): `pnpm --filter @wad/db db:migrate --name <change>`; backwards-compatible; update factories in `packages/testing`.
3. **Core**: `<domain>.schemas.ts` (Zod) → failing integration tests `[ID] …` in `<domain>.service.test.ts` → `<domain>.service.ts` (authz first, one transaction, emit event). Update the README.
4. **API**: route in `packages/api` reusing the schema; tests for 401/403/400/404/409/happy + OpenAPI shape; API e2e in `apps/e2e/tests/api` titled `[ID]`.
5. **Web**: `<feature>.queries.ts` / `<feature>.actions.ts` (`createAction`), presentational components with stories, a container for wiring, the route page. Strings in `packages/i18n/messages/{en,fr}`.
6. **UI e2e**: `apps/e2e/tests/ui/<feature>.spec.ts` titled `[ID] …`, `expectAccessible` on each new screen.
7. Verify: `pnpm verify`, `pnpm test:e2e`, `pnpm test:api`, `pnpm check:story-coverage`.
8. Changeset + PR using the template, branch `WD-123-slug`, commits `WD-123 …`.
