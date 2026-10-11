# Architecture

## Packages

```
apps/web ──► @wad/api ──► @wad/core ──► @wad/db
    │            └──────► @wad/auth ──► @wad/db, @wad/email
    ├──────────────────► @wad/core, @wad/auth, @wad/ui, @wad/i18n
apps/storybook ──► @wad/ui, apps/web feature components (fixtures only)
apps/e2e ──► built apps/web, @wad/testing, @wad/auth (token minting)
@wad/ui ──► nothing internal
```

Internal packages export TypeScript source (no build step). Next.js transpiles them (`transpilePackages`).

## Two front doors

| Door                                    | Callers                        | Auth                                                                                       |
| --------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| Server Actions + RSC + `/api/auth/*`    | our web app only               | session cookie (`wad.*`, httpOnly, SameSite=Lax, Secure in prod), Better Auth origin check |
| `/api/v1/*` (Hono) and later `/api/mcp` | CLI, MCP, mobile, integrations | `Authorization: Bearer wad_…` API token only; cookies ignored; `PUBLIC_API_ENABLED` gate   |

Both build the same `Ctx` (`userId`, `via`, `locale`, `scopes`) and call the same core services.

## Request lifecycle

- **Read:** RSC page → `features/x/x.queries.ts` (`"use cache"`, `cacheTag`) → core → Prisma.
- **Write:** form → Server Action (`createAction`: session → Zod → core) → transaction + event → `updateTag` → `Result<T>`.
- **External:** `/api/v1` → bearer token → `Ctx` with scopes → core.

## Auth

Better Auth with the email OTP plugin (6 digits, 10 min, 5 attempts, stored hashed, 3 sends/min) and the API key plugin (prefix `wad_`, hashed, per-key rate limit). Rate limits are stored in Postgres so they hold on serverless.
Existing users keep their account: their email was backfilled onto `users.email` by the `better_auth` migration.

## Data

Prisma 7 with `@prisma/adapter-pg`. Schema and migration history were carried over from the NestJS API; new migrations only from here.

## Hosting

Vercel (web + API) · Neon Postgres (branch per preview) · Resend (email) · Cloudflare (DNS `wan-a.dance`, R2 later).
