# apps/web — Next.js rules

- `src/app/**` is routing only: read params, call queries, compose feature components. No logic.
- Features: `src/features/<name>/`
  - `components/` presentational, props in → JSX out, each with a story (CI checks).
  - `containers/` wiring (router, server actions, auth client); covered by UI e2e.
  - `<name>.actions.ts` (`'use server'`, `createAction`), `<name>.queries.ts` (`"use cache"` + `cacheTag`).
  - `index.ts` is the only import path for other features and routes.
- Server-only code imports `server-only`. Session: `requireSession()` from `@/server/auth`.
- Strings: `useTranslations`/`getTranslations`; lint fails on literal JSX text.
- UI from `@wad/ui` only. Layout via `AppShell`, pages start with `PageHeader`.
- Never fetch our own `/api/v1` from the web app; call core through queries/actions.
- `/api/v1` and `/api/mcp` are bearer-token only; `PUBLIC_API_ENABLED=false` in production until R4.
