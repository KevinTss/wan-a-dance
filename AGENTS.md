# Wan a Dance — agent rules

Dance school platform. pnpm + Turborepo monorepo, Next.js full stack, Postgres (Neon) via Prisma, Better Auth, Hono public API.
Product scope: `docs/product/FEATURES.md` · Stories: `docs/product/IMPLEMENTATION_PLAN.md` · Current release: `docs/product/CURRENT_RELEASE`.
Knowledge base: Confluence space WD · Delivery: Jira project WD.

## Golden rules

1. Search before you create. Reuse `@wad/ui` components, `@wad/core` helpers, existing schemas and factories.
2. Stay in scope: build only stories listed for the current release. Unlisted work → propose a Jira issue, don't build it.
3. No business logic in `apps/web/src/app` or React components. It lives in `packages/core/src/<domain>/*.service.ts`.
4. Web mutations go through `createAction` (`apps/web/src/lib/action.ts`) with a Zod schema and an explicit authz check.
5. One state change = one Prisma transaction + one domain event + cache tag update.
6. IDs from `generateId(ID_PREFIXES.X)`. Errors are `AppError` with codes from `@wad/core`. Money uses the `Money` type (minor units, never floats).
7. UI imports only `@wad/ui`. Never `radix-ui`, raw Tailwind palette classes, hex colours or arbitrary values.
8. Every user-facing string goes through `t()` with keys in `packages/i18n/messages/{en,fr}`. Both locales, same keys.
9. No `any`, no unexplained `as`, no `eslint-disable` without `-- reason`.
10. New dependency or pattern → ADR in `docs/adr/`.
11. **No code comments by default.** Only the _why_ of something non-obvious (workaround, business rule, security). Never the _what_. No commented-out code, no TODO without a Jira key.
12. **Be terse.** Final reply ≤ 5 lines: what changed, what was verified, what's blocked. No preamble, no diff recap.
13. Done means `pnpm verify` is green (plus `pnpm test:e2e` / `pnpm test:api` when you touched flows).

## Layout

```
apps/web        Next.js: routes (thin), features/<name>/{components,containers,*.actions.ts,*.queries.ts}
apps/storybook  One Storybook for packages/ui + apps/web feature components
apps/e2e        Playwright: tests/ui (journeys), tests/api, tests/visual, tests/smoke
packages/core   Domain services + schemas. Framework-agnostic: never imports next/* or react
packages/db     Prisma schema, migrations, client
packages/auth   Better Auth (email OTP, API keys)
packages/api    Hono /api/v1 (bearer tokens only), OpenAPI
packages/ui     Design system: tokens, primitives, patterns, layout
packages/i18n   Messages (en, fr), locale + date helpers
packages/email  React Email templates, mail adapters (resend | capture)
packages/testing Postgres harness (template DB per worker), factories
```

Import graph: `web → api → core → db`; `web → ui`; `ui → nothing internal`. Features import other features only via `@/features/<name>`.

## Commands

```
pnpm db:up                 start local Postgres (docker, port 5433)
pnpm dev                   all apps (web :3000, storybook :6006)
pnpm verify                format, typecheck, lint, unit+integration, stories, checks
pnpm test:e2e | test:api   Playwright UI journeys | API e2e (needs pnpm db:up and a web build)
pnpm test:visual           visual regression in the Playwright Docker image (--update-snapshots to accept)
pnpm --filter @wad/db db:migrate   create a migration (never edit applied ones)
pnpm changeset             describe a user-visible change (empty for internal-only)
```

## Testing (see docs/testing.md)

- Domain logic: Vitest against real Postgres via `@wad/testing` (no mocks of our own code).
- Components: a story per state + `play` interaction test; axe runs as error in light, dark and mobile.
- Every story ID gets a UI e2e spec titled `[R1-XXX-NN] …` and, if it has backend logic, an API/integration test with the same tag.
- Locators: roles and labels only. No `waitForTimeout`, no `force`.

## Delivery

- Work on an existing Jira issue. Branch `WD-123-slug`, commits `WD-123 Imperative summary`, PR title `WD-123 …`.
- Don't create, transition or comment on Jira/Confluence without explicit approval.
- Each PR: changeset, tests, stories, docs/README updated when behaviour changes. Use the PR template checklist.

## Where to read more

`docs/architecture.md` · `docs/conventions.md` · `docs/testing.md` · `docs/design-system.md` · `docs/adr/` · scoped `AGENTS.md` in each package.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
