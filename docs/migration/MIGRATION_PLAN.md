# Dance App — Full-Stack Next.js Migration Plan

**Date:** 2026-10-10
**Status:** Draft, waiting for review. No code yet.
**Scope:** Merge `api/` (NestJS + Prisma) and `web-app/` (Next.js 16 + shadcn) into **one full-stack Next.js app**. It gets a Dia-inspired minimal UI, a design system documented in Storybook, and guardrails that keep AI agents on the code guidelines.

---

## 0. TL;DR

1. **Turborepo monorepo, one deploy to start.** Business logic moves from NestJS into a framework-agnostic `packages/core`, used by the Next.js app in `apps/web`. Reads come from Server Components. Writes go through Server Actions. Route Handlers are used for webhooks, cron and the versioned public API (`/api/v1`) that a CLI, MCP server and mobile app will use. All entry points call the same framework-agnostic core services.
2. **Same database, same schema.** Reuse the existing Prisma 7 schema and PostgreSQL data as they are. No data migration is needed for the domain tables. Only the auth tables get a planned migration.
3. **Design system first, in `packages/ui`.** Tokens, primitives, patterns and the app shell are built and documented in Storybook **before** any feature screen is migrated. Feature screens may only be built from design-system components.
4. **Docs and enforcement are part of the build.** Agents follow a root `AGENTS.md` plus scoped `AGENTS.md` files, ADRs and feature READMEs. Lint rules, CI gates and Claude Code hooks enforce the rules mechanically, so they don't rely on agents remembering them.
5. **Every screen is translated (`en`/`fr`) and supports multiple currencies from the start.**
6. **Migrate one domain at a time, ordered by dependencies.** Each domain is done only when it has a ported service, ported tests, UI, stories, an e2e flow and an updated README.

---

## Project resources

| What                      | Where                                                                         | Used for                                                  |
| ------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Product name / domain** | **`wan-a.dance`** (registrar + DNS on **Cloudflare**)                         | App, marketing, API, email sending domain                 |
| **Code**                  | **GitHub** `git@github.com:KevinTss/wan-a-dance.git`                          | Monorepo (replaces `dance-app/api` + `dance-app/web-app`) |
| **Knowledge base**        | **Confluence** space `WD`: https://screenside.atlassian.net/wiki/spaces/WD/   | Product, plans, decisions summaries, runbooks             |
| **Delivery**              | **Jira** project `WD`: https://screenside.atlassian.net/jira/core/projects/WD | Epics, stories, tasks, bugs                               |
| Hosting                   | Vercel (app) · Neon (Postgres) · Cloudflare R2 (files) · Resend (email)       | See §10 for costs                                         |

### Domains and DNS (all managed in Cloudflare)

| Host                                | Points to                                   | Purpose                                                            |
| ----------------------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| `wan-a.dance`                       | Vercel (production)                         | Marketing + app entry                                              |
| `app.wan-a.dance`                   | Vercel (same project), optional             | App, if we split marketing and app later. Start with a single host |
| `api.wan-a.dance`                   | Vercel rewrite → `/api/v1`                  | Public API (R4)                                                    |
| `storybook.wan-a.dance`             | Vercel (storybook project)                  | Design system docs (can be password-protected)                     |
| `files.wan-a.dance`                 | Cloudflare R2 public bucket / custom domain | Materials and media                                                |
| `mail.wan-a.dance` (send subdomain) | Resend SPF/DKIM records + DMARC on root     | Transactional email (`no-reply@wan-a.dance`)                       |
| Previews                            | `*.vercel.app`                              | Never use the production domain for previews                       |

DNS records for Vercel are set to **DNS only** (grey cloud), as Vercel recommends. Cloudflare proxying in front of Vercel breaks its cache and certificates.

### Where documentation lives (repo vs Confluence)

Agents need engineering rules in the repo, versioned with the code. People need product knowledge in one shared place. So each doc has **one** source of truth:

| Lives in the **repo** (source of truth)                                                                                                      | Lives in **Confluence `WD`** (source of truth)                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md` files, `docs/architecture.md`, `conventions.md`, `testing.md`, `design-system.md`, ADRs, domain `README.md` files, parity matrix | Product vision, FEATURES, IMPLEMENTATION_PLAN (releases and user stories), costs, decision log summaries, release notes, runbooks (deploy, incident, DNS), meeting notes, school feedback |

- The Confluence home page links to the repo docs. Repo `AGENTS.md` links to the Confluence space for product context.
- These three draft files (`MIGRATION_PLAN.md`, `FEATURES.md`, `IMPLEMENTATION_PLAN.md`) are **published to Confluence** in Phase 0. Engineering sections (architecture, conventions, enforcement) are copied into repo `docs/`.
- Agents read Confluence and Jira through the Atlassian MCP connector. Writing to Confluence or Jira needs explicit approval per action.
- `/document-release` updates both: repo docs in the PR, Confluence release notes after each version (§5.5).

### Delivery workflow (Jira `WD` + GitHub)

- **Hierarchy:**
  - Release = **Jira version** (`R0`…`R6`).
  - Epic = feature epic (`ACC`, `MEM`, `EVT`…).
  - Story = one user story.
  - Sub-tasks or tasks only when a story is too big.
- **Story mapping:** each story keeps its plan ID in the summary, for example `[R1-MEM-03] Edit or archive a member`. The plan ID also goes in a label (`r1`) and the epic link.
- **Story content:** description = user story + acceptance criteria. Done = Definition of Done (§5.4).
- **Branch:** `WD-123-short-slug` · **Commit:** `WD-123 Add member archive` · **PR title:** `WD-123 …`
  - The **GitHub for Jira** app (free) links branches, commits, PRs and deployments to the issue automatically.
- **Statuses:** `To do → In progress → In review → Done`. A PR merge moves the issue to Done (Jira automation).
- **Agent rules:**
  - Work only on an existing Jira issue. Put its key in the branch, commits and PR.
  - Don't create, transition or comment on Jira issues without approval.
  - If work isn't covered by a story, propose a new issue instead of doing it.
- **Backlog:** new ideas go to Jira (`Backlog` status, label `idea`), not Notion. The Notion page is archived after Phase 0.

---

## 1. What exists today (inventory)

### Product (from Notion)

A platform for dance studios, schools, communities and dancers.

- **B2B:** owners, teachers and students manage members, scheduling, materials and analytics.
- **B2C (future):** dancers discover schools and events, and can find dance partners.

Status in Notion: _Paused_. The API is hosted on Render. Postgres is on Render, and a Vercel Postgres store also exists. GitHub org: `dance-app`.

### `api/`: NestJS 11 + Prisma 7 + Postgres

| Area             | Notes                                                                                                                                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modules          | `auth`, `workspace` (both **validated** reference modules), `member`, `event`, `material`, `invitation`, `notification`, `user`, `credits` (products, prices, purchases, grants, attendees, cancellation policy), `whatsapp` (messaging + Meta webhook), `mail`, `pagination`, `role`, `ping`                       |
| Endpoints        | About 82 REST endpoints in 14 controllers                                                                                                                                                                                                                                                                           |
| Schema           | 25 models, 26 enums (`api/prisma/schema.prisma`, 862 lines). Covers the member lifecycle state machine, credits ledger, WhatsApp conversations and materials marketplace                                                                                                                                            |
| Patterns to keep | Prefixed IDs (`lib/id-generator`), response envelope + kebab-case message codes (`lib/api-response`, `lib/constants`), domain events (`resource.action`), guards (`JwtGuard`, `MemberGuard`, `SuperAdminGuard`, `CanViewWorkspace`, `WorkspaceRoles`), argon2 password hashing, one DB transaction per state change |
| Tests            | About 134 e2e cases: member 62, auth 31, user 19, event 15, workspace 4, material 3. Plus unit specs. **These define the behaviour the new app must match.**                                                                                                                                                        |
| Docs             | `api/docs/*`: master plan, member lifecycle, credits/entitlements, WhatsApp, frontend API spec, etc. These are the domain source of truth and get carried over.                                                                                                                                                     |

### `web-app/`: Next.js 16.1 + React 19 + Tailwind v3 + shadcn

- Routes: auth (sign-in, sign-up, confirm, forgot), create-workspace, `/w/[slug]` → dashboard, classes (+ detail and manage), members, materials, settings, subscriptions.
- NextAuth v4 talks to the Nest JWT + refresh tokens. `proxy.ts` handles cookie gating.
- About 35 TanStack Query hooks. Some `/api/*` proxy routes are still mocked or incomplete (see `web-app/TODO.md`).
- About 55 shadcn primitives (many unused). 6 stories in a separate `stories/` folder. Storybook 10 + addon-vitest + a11y are already installed.
- CI: format, lint and type-check only. Runs on Node 18.
- ⚠️ **Uncommitted work** in `components/members/member-details-drawer/*`. Commit or stash it before starting.

### Problems the migration fixes

- Two deploys and two auth systems glued together with token refresh. A proxy layer with mocks, plus mismatches between `slug` and `id` usage.
- Design primitives aren't curated: anything from shadcn gets used, and stories are thin.
- Agent rules are split across `api/AGENTS.md`, `web-app/AGENTS.md` and `web-app/.claude/CLAUDE.md`, and they contradict each other (for example, "Next.js 14" against the installed 16).

---

## 2. Target stack (decisions + rationale)

> Check the latest stable versions at kickoff (`npm view <pkg> version`). Pin exact versions and don't use `latest`.

| Concern                | Choice                                                                                                                                                                                                                                          | Why                                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Framework              | **Next.js (latest stable, App Router, Turbopack)**, React 19.x, TypeScript `strict`                                                                                                                                                             | Single full-stack runtime                                                                                                                 |
| Caching                | **Cache Components** (`"use cache"`, `cacheTag`, `updateTag`)                                                                                                                                                                                   | Explicit and predictable caching. Mutations update tags                                                                                   |
| Styling                | **Tailwind CSS v4** (CSS-first `@theme` tokens)                                                                                                                                                                                                 | Tokens live in CSS, so there's no JS config drift                                                                                         |
| Primitives             | **shadcn/ui (latest, Radix-based)**, copied in and _curated_                                                                                                                                                                                    | We own the code, and only the components we approve get in                                                                                |
| Icons                  | `lucide-react` only                                                                                                                                                                                                                             | One icon language                                                                                                                         |
| DB / ORM               | **Prisma 7** + `@prisma/adapter-pg`, existing schema                                                                                                                                                                                            | Zero domain data migration                                                                                                                |
| Auth                   | **Better Auth**. **R1: 6-digit email code only** (`emailOTP` plugin, sent with Resend) + database sessions. Later: Google, Apple, WhatsApp code (`phoneNumber`), password (argon2), account linking. `apiKey` plugin for public API tokens (R4) | Built for Next.js full-stack. Replaces the custom JWT + refresh and NextAuth v4                                                           |
| Validation             | **Zod** (one schema shared by forms, actions and route handlers)                                                                                                                                                                                | Replaces class-validator DTOs                                                                                                             |
| Forms                  | React Hook Form + Zod resolver, wrapped in design-system `Form` components                                                                                                                                                                      | Matches the current approach                                                                                                              |
| Client data            | Server Components by default. TanStack Query **only** where needed (infinite scroll, polling)                                                                                                                                                   | Removes about 35 fetch hooks                                                                                                              |
| Client state           | URL state (`nuqs`) for filters and tabs. Avoid global stores; `jotai` gets dropped                                                                                                                                                              | Shareable, SSR-friendly state                                                                                                             |
| Dates                  | `date-fns` only (drop `dayjs`)                                                                                                                                                                                                                  | One library                                                                                                                               |
| Mail                   | React Email + Resend (or the existing SMTP via nodemailer behind one interface)                                                                                                                                                                 | Templates as components                                                                                                                   |
| Background work        | Vercel Cron (credit expiry, LAPSED transitions) + Vercel Queues/Workflow for retries (WhatsApp sends)                                                                                                                                           | Replaces in-process jobs                                                                                                                  |
| Domain events          | Small typed in-process emitter in `src/server/events` (same `resource.action` names)                                                                                                                                                            | Keeps the existing pattern                                                                                                                |
| Testing                | Vitest (unit + integration against a Postgres test DB), Storybook + addon-vitest (component, interaction, a11y), Playwright (e2e flows)                                                                                                         |                                                                                                                                           |
| Quality                | ESLint flat config + `eslint-plugin-boundaries` + `eslint-plugin-better-tailwindcss`, Prettier, `knip` (dead code), lefthook pre-commit                                                                                                         | Mechanical enforcement                                                                                                                    |
| Package manager / Node | pnpm, Node 22 LTS (or newer LTS)                                                                                                                                                                                                                | CI is on Node 18 today, which is EOL                                                                                                      |
| Hosting                | **Vercel Pro** (app + public API + MCP) + **Neon Postgres** (via Vercel Marketplace)                                                                                                                                                            | Preview deploys per PR, with one Neon branch per preview. Cron, Queues, Workflow, WebSockets and containers are built in                  |
| Public API             | **Hono** + `@hono/zod-openapi` mounted at `app/api/v1/[[...route]]`                                                                                                                                                                             | Portable: the same app runs on Node, Bun or Cloudflare if it ever needs to leave Vercel. Generates an OpenAPI spec and a typed client SDK |
| Files                  | **Cloudflare R2** (S3 API, zero egress) for materials and videos                                                                                                                                                                                | Video egress is the biggest cost risk. R2 doesn't charge for it                                                                           |
| Observability          | Sentry (errors) + Vercel Analytics/Speed Insights                                                                                                                                                                                               |                                                                                                                                           |

---

## 3. Target repository structure: Turborepo monorepo

**Decided: pnpm workspaces + Turborepo.** Why Turborepo rather than Nx:

- Small config (`turbo.json` + `pnpm-workspace.yaml`).
- Free remote cache on Vercel.
- Vercel skips builds for apps a commit doesn't affect.
- Fewer concepts, so agents spend fewer tokens.

Nx's generators and plugins are more than a solo project with agents needs.

Internal packages are **just-in-time**: they export TypeScript source and have no build step. Next.js `transpilePackages` and Vitest compile them directly, which keeps the dev loop fast. Only `packages/sdk` (published later) gets a real build.

Repo: `github.com/KevinTss/wan-a-dance`, cloned locally as `dance-app/wan-a-dance/`. The old `api/` and `web-app/` stay read-only references until cutover.

```
wan-a-dance/
├── AGENTS.md                      # Canonical agent rules (single source of truth)
├── CLAUDE.md                      # One line: @AGENTS.md
├── turbo.json                     # Tasks: dev, build, lint, typecheck, test, test:e2e, storybook
├── pnpm-workspace.yaml
├── docs/
│   ├── architecture.md            # Package graph, data flow, request lifecycle
│   ├── conventions.md             # Naming, files, imports, errors, i18n, money
│   ├── design-system.md           # Principles, tokens, component tiers, do/don't
│   ├── testing.md                 # Test pyramid, fixtures, test DB, visual baselines
│   ├── adr/                       # 0001-full-stack-nextjs.md, 0002-better-auth.md, ...
│   ├── domain/                    # Carried over from api/docs (member lifecycle, credits, whatsapp…)
│   └── migration/                 # This plan + per-domain checklists + parity matrix
├── apps/
│   ├── web/                       # Next.js: UI, Server Actions, mounts packages/api + MCP
│   │   ├── AGENTS.md
│   │   └── src/
│   │       ├── app/
│   │       │   ├── [locale]/(marketing)/   # Public B2C pages, locale-prefixed for SEO
│   │       │   ├── (auth)/                 # sign-in, sign-up, verify, reset
│   │       │   ├── (app)/                  # App shell; w/[slug]/dashboard, schedule, members…
│   │       │   └── api/
│   │       │       ├── v1/[[...route]]/route.ts   # → packages/api (Hono)
│   │       │       ├── mcp/[transport]/route.ts   # MCP server → packages/core
│   │       │       ├── auth/[...all]/route.ts     # Better Auth
│   │       │       ├── cron/*  webhooks/*
│   │       ├── features/<domain>/
│   │       │   ├── README.md              # UI-side notes. Domain rules live in packages/core
│   │       │   ├── <domain>.queries.ts    # "use cache" + cacheTag → core services
│   │       │   ├── <domain>.actions.ts    # "use server" via createAction → core services
│   │       │   ├── components/<name>/     # index.tsx + .stories.tsx, built from @wad/ui only
│   │       │   └── fixtures.ts
│   │       ├── lib/action.ts              # createAction(): session → ctx → zod → core → Result
│   │       └── i18n/                      # next-intl request config, routing
│   ├── storybook/                 # One Storybook: loads packages/ui + apps/web/features stories
│   ├── e2e/                       # Playwright: user journeys + visual regression
│   ├── mobile/                    # (later) Expo, uses @wad/sdk + @wad/i18n
│   └── cli/                       # (later) Node CLI, uses @wad/sdk
├── packages/
│   ├── core/                      # ★ Domain logic. Framework-agnostic: never imports next/*, react
│   │   ├── AGENTS.md
│   │   └── src/
│   │       ├── <domain>/          # members/, events/, credits/ …
│   │       │   ├── README.md              # Domain truth: rules, state machine, permissions
│   │       │   ├── <domain>.service.ts    # Port of the Nest service; (ctx, input) functions
│   │       │   ├── <domain>.schemas.ts    # Zod: shared by actions, API, mobile, forms
│   │       │   └── <domain>.service.test.ts
│   │       ├── authz/             # requireWorkspaceMember, roles, status gates (Nest guard ports)
│   │       ├── money/             # Money type, minor units, formatting helpers (§6.6)
│   │       ├── ctx.ts  errors.ts  ids.ts  events.ts  result.ts
│   ├── db/                        # Prisma schema, migrations, client, seed, test factories
│   ├── auth/                      # Better Auth server config + client (web, expo, bearer, apiKey, mcp)
│   ├── api/                       # Hono app + @hono/zod-openapi routes → core. Deployable standalone
│   ├── ui/                        # ★ Design system (see §4)
│   │   ├── AGENTS.md
│   │   └── src/ tokens/ primitives/ patterns/ layout/ index.ts
│   ├── i18n/                      # Locales, messages/{en,fr,nl}/<namespace>.json, formatters
│   ├── email/                     # React Email templates, localized
│   ├── sdk/                       # (later) OpenAPI-generated typed client
│   └── config/                    # Shared tsconfig, eslint flat config, prettier, vitest presets
├── .claude/
│   ├── settings.json              # Hooks (lint/typecheck on edit), permissions, output style
│   └── skills/                    # new-component, new-feature, migrate-domain
└── .github/workflows/ci.yml, pull_request_template.md
```

### Package graph (enforced by `package.json` dependencies + `eslint-plugin-boundaries`)

```
apps/web ──► api ──► core ──► db
    │         └────► auth ──► db
    ├──────────────► core, auth, ui, i18n, email
apps/storybook ──► ui, apps/web features (fixtures only)
apps/mobile, apps/cli ──► sdk, i18n
ui    ──► nothing internal (strings come in via props)
core  ──► db, i18n (types only). Never next/*, react, ui
web   ──► never imports @wad/db directly (only through core)
features/x ──► never imports features/y internals
```

### Request lifecycle

- **Read (web):** an RSC page calls `features/x/x.queries.ts`. The query (`"use cache"` + `cacheTag('members:{workspaceId}')`) calls `core` with `ctx`.
- **Write (web):** a form calls a Server Action through `createAction`. That builds `ctx` from the session, parses Zod and calls the `core` service. The service runs a transaction and emits a domain event. The action calls `updateTag` and returns `Result<T>`.
- **External:** `/api/v1` (Hono) and `/api/mcp` build `ctx` from an API key or OAuth token, then call the same `core` services.

---

## 4. Design system: Dia-inspired, minimal

### 4.1 Principles (written in `docs/design-system.md`)

1. **Quiet chrome, loud content.** No heavy borders or gradients. Surfaces are separated by subtle tone shifts and soft shadows.
2. **One accent colour.** Neutrals do almost all the work. The accent is reserved for primary actions, focus and selection.
3. **Floating, rounded surfaces.** A soft translucent sidebar and content in a single rounded "card" canvas, like Dia's window-in-window feel. Radius scale: 8/12/16.
4. **Keyboard-first.** A ⌘K command bar is the main way to navigate and act. Every primary action has a shortcut.
5. **Calm density.** 14px base, 13px secondary text, generous spacing on a 4px grid, at most 2 type weights per screen.
6. **Subtle motion.** 150–200ms ease-out, no bounce, and `prefers-reduced-motion` is respected.
7. **Light and dark from day one**, all through tokens.
8. **Accessible by default.** WCAG AA contrast, visible focus rings, full keyboard support. The Storybook a11y addon must pass.

### 4.2 Tokens (`packages/ui/src/tokens/tokens.css`, Tailwind v4 `@theme`)

- **Colour (semantic only):** `--color-canvas`, `--color-surface`, `--color-surface-raised`, `--color-sidebar` (translucent), `--color-border-subtle`, `--color-text`, `--color-text-muted`, `--color-text-faint`, `--color-accent`, `--color-accent-fg`, plus status colours `success | warning | danger | info`. Domain colours like dance role and member status map onto these; they never introduce new hex values.
- **Type:** Geist/Inter variable. Scale `xs 12 / sm 13 / base 14 / lg 16 / xl 20 / 2xl 24 / display 32`.
- **Space:** 4px grid. **Radius:** `sm 6 / md 8 / lg 12 / xl 16 / full`. **Shadow:** `sm / md / overlay`. **Motion:** `--ease-out`, `--duration-fast 150 / base 200`.
- **Rule:** components use only semantic token utilities (`bg-surface`, `text-muted`). No raw hex values, no arbitrary values like `[#..]` or `[13px]`, and no raw palette classes (`bg-zinc-100`) outside `tokens/`. A lint rule enforces this.

### 4.3 Component tiers (each tier can only import from tiers below it)

| Tier                  | Location                             | Contents (initial set, so we don't install all of shadcn)                                                                                                                                                                                         |
| --------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primitives**        | `packages/ui/src/primitives`         | Button, IconButton, Input, Textarea, Select, Checkbox, Switch, RadioGroup, Label, Badge, Avatar, Tooltip, Popover, DropdownMenu, Dialog, Sheet (drawer), Tabs, Separator, Skeleton, Spinner, Toast (sonner), Kbd, Calendar/DatePicker, PhoneInput |
| **Patterns**          | `packages/ui/src/patterns`           | FormField (label + control + error), Form, DataTable (sort/filter/paginate/empty/loading), EmptyState, PageHeader, Toolbar/FilterBar, CommandBar (⌘K, cmdk), ConfirmDialog, StatCard, ListRow, Section, InfiniteList, InlineEditable              |
| **Layout**            | `packages/ui/src/layout`             | AppShell, Sidebar (collapsible, workspace switcher slot), Inset (content canvas), Stack/Inline, MobileNav                                                                                                                                         |
| **Domain components** | `apps/web/src/features/*/components` | MemberStatusBadge, DanceRoleTag, ParticipationTag, EventCard, ScheduleSentence, MemberDrawer… built only from the tiers above                                                                                                                     |

### 4.4 Storybook rules

- Stories sit next to the component they cover (`button/button.stories.tsx`), not in a global `stories/` folder.
- **Every** design-system and domain component ships with:
  - CSF3 stories: `Default` + every variant/size + states (disabled, loading, error, empty) + a `Playground` with args.
  - `tags: ['autodocs']` with a short usage description and do/don't notes.
  - Interaction tests (`play`) for interactive components, run via `@storybook/addon-vitest` in CI.
  - a11y checks set to `error` level (not just `warn`).
- A theme toolbar (light/dark) and a viewport toolbar (mobile/desktop) are set globally.
- Sidebar order: `Foundations/` (colours, type, spacing, motion, icons as MDX docs) → `Primitives/` → `Patterns/` → `Layout/` → `Features/<Domain>/` → `Screens/` (full-page compositions with fixtures).
- Domain stories use `apps/web/src/features/*/fixtures.ts`. They never call the network or Prisma.
- Visual regression runs for free: Playwright `toHaveScreenshot()` over every story in the static Storybook build (§7, testing).

### 4.5 Design exploration step (before building tokens)

Run `/design-consultation` (or `/design-shotgun`) with Dia as the reference to pick the font, neutral ramp, accent, radius and shadow values. Output: a one-page token decision added to `docs/design-system.md` and a `Foundations` MDX page. Then `/plan-design-review` on the result.

---

## 5. Agent guidelines and documentation system

The goal is that an agent starting cold in any folder gets the right rules, and that breaking them fails a check.

### 5.1 Instruction files (layered, no duplication)

| File                              | Content                                                                                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md` (root)                | Canonical rules: stack, commands, layer map, golden rules (below), definition of done, where docs live. Keep it short (~150 lines) and link out to `docs/*` for detail |
| `CLAUDE.md`                       | `@AGENTS.md` only, so Claude Code imports the canonical file                                                                                                           |
| `packages/ui/AGENTS.md`           | DS rules: tokens only, tier imports, story and test requirements, how to add a primitive (shadcn add, then curate, then story)                                         |
| `packages/core/AGENTS.md`         | Domain rules: `(ctx, input)` services, Zod schemas, transactions, events, authz, money, no framework imports, README update requirement                                |
| `apps/web/AGENTS.md`              | Pages are thin: composition, queries/actions → core, `createAction`, cache tags, `loading`/`error` files, every string through `t()`                                   |
| `packages/db/AGENTS.md`           | Migration workflow, ID prefixes, never edit applied migrations, transaction rules                                                                                      |
| `packages/core/src/<x>/README.md` | Domain truth: entities, state machines, permissions matrix, invariants, links to `docs/domain/*`                                                                       |
| `docs/adr/NNNN-*.md`              | Every non-obvious decision (template: context / decision / consequences). Agents must add an ADR when they introduce a new dependency or pattern                       |

### 5.2 Golden rules (top of `AGENTS.md`)

1. Search before you create: reuse existing DS components, services and schemas.
2. Feature UI imports only from `@wad/ui`. Never import `@radix-ui/*`, raw shadcn files or palette colours directly.
3. No business logic in `app/` or in components. It belongs in `packages/core/src/<domain>/*.service.ts`.
4. Every mutation goes through `createAction` with a Zod schema and an explicit authz check.
5. Every state change is one Prisma transaction plus a domain event plus a cache tag update.
6. IDs come from `core/ids.ts`. Errors come from `core/errors.ts` codes. User-facing text goes through `t()`. Amounts use the `Money` type (§6.6).
7. Every new component gets a story. Every new service method gets a test. Every changed domain rule gets a README update.
8. No `any`, no `as` casts without a comment, no `eslint-disable` without a reason.
9. Don't add dependencies without an ADR.
10. A task is done only when `pnpm verify` passes.
11. **No code comments by default.** Comment only the _why_ behind something that isn't obvious: a workaround, a business rule, a security constraint. Never comment the _what_. No JSDoc on self-explanatory code, no commented-out code, no `// TODO` without a linked issue.
12. **Be terse.** Replies, PR descriptions and commit messages are short and factual. No preamble, no recap of the diff, no filler.
13. **Stay in scope.** Build only what `docs/product/FEATURES.md` lists for the current release. If something isn't listed, ask or update that file first.

### 5.2b Token efficiency (rules for agents)

Goal: agents spend tokens on the work, not on prose or re-reading files.

**Writing code**

- Names carry the meaning, so code needs no comments (see golden rule 11).
- Make the smallest diff that solves the task. Don't refactor unrelated code or reformat untouched lines.
- Don't write throwaway files (scratch notes, `SUMMARY.md`, example files) unless asked.

**Replying**

- At most 3–5 lines at the end of a task: what changed, what was verified, what's blocked.
- Don't paste back code that's already in the diff, and don't restate the request.
- Ask a question only when blocked. Otherwise pick the documented convention and move on.

**Reading context**

- Read `AGENTS.md` plus the scoped `AGENTS.md` and `README.md` for the folder being worked on. Don't explore the whole repo.
- Search first, then read the specific file region you need, not whole directories.
- Docs are the index: feature READMEs list the public API and key files, so agents don't have to open everything.

**Keeping instruction files lean** (they're loaded every session)

- Root `AGENTS.md` stays at or under ~150 lines. Scoped `AGENTS.md` files stay at or under ~60 lines.
- Write rules as one-line imperatives. Link to `docs/*` for the detail.
- No examples longer than ~10 lines in instruction files. Point to a reference file instead (`see apps/web/src/features/members/members.actions.ts`).
- Never duplicate a rule across files. Rules belong to the narrowest scope that needs them.

**Enforcement**

- Lint rules: `no-warning-comments` (TODO/FIXME need an issue ref) and `eslint-plugin-no-comments`-style checks for commented-out code.
- `scripts/check-agents-size.ts` fails CI if an `AGENTS.md` exceeds its line budget.
- An output style for the project, set in `.claude/settings.json`, sets concise responses as the default.
- Subagents are spawned only for real fan-out work (for example, parity audits across many modules), never for single-file tasks.

### 5.3 Mechanical enforcement

| Mechanism                                        | What it catches                                                                                                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint-plugin-boundaries` + workspace deps      | Package-graph violations (§3), feature → feature internals, `next/*` inside `core`                                                                                              |
| `no-restricted-imports`                          | `@radix-ui/*` outside `ui`, `@prisma/client` outside `db`/`core`, `dayjs`, `jotai`                                                                                              |
| `better-tailwindcss` + a custom rule             | Arbitrary values, raw palette classes, hex colours in TSX                                                                                                                       |
| `i18next/no-literal-string` (JSX) + `i18n-check` | Hardcoded UI strings, missing or unused translation keys across locales                                                                                                         |
| `scripts/check-stories.ts`                       | Fails if a component folder in `packages/ui/src/` or `apps/web/src/features/*/components/` has no `.stories.tsx`                                                                |
| `scripts/check-agents-size.ts`                   | Fails if an `AGENTS.md` file goes over its line budget (§5.2b)                                                                                                                  |
| `scripts/check-docs.ts`                          | Fails if `packages/core/src/<x>/**` changed but its `README.md` didn't (can be skipped with a `docs-not-needed` PR label)                                                       |
| `knip`                                           | Unused files, exports and deps                                                                                                                                                  |
| `pnpm verify`                                    | `turbo run typecheck lint test test:storybook` + `check:stories check:docs check:i18n`. Turbo only runs affected packages. One command for agents and CI                        |
| **Claude Code hooks** (`.claude/settings.json`)  | `PostToolUse` on Edit/Write runs `eslint --fix` + `tsc --noEmit` scoped to the touched file and reports errors back to the agent. `Stop` hook runs `pnpm verify:fast`           |
| Project skills (`.claude/skills/`)               | `new-component` (scaffolds folder + story + test following DS rules), `new-feature` (scaffolds the feature anatomy + README), `migrate-domain` (step-by-step checklist from §7) |
| lefthook pre-commit                              | Prettier + ESLint on staged files                                                                                                                                               |
| CI (GitHub Actions)                              | `pnpm verify` + `turbo build` + Playwright (e2e + visual + axe) against a Postgres service container + Vercel preview. Turbo remote cache via Vercel (free)                     |
| PR template                                      | Definition-of-done checklist: tests, stories, README/ADR, screenshots, migration notes                                                                                          |
| `/review` and `/code-review`                     | Run before each PR merge                                                                                                                                                        |

### 5.5 Versioning, tags and release notes

**Model: continuous deployment + semver milestones.**

- Every merge to `main` deploys to production (Vercel). Unfinished work hides behind feature flags (Flags SDK / Vercel Flags), so we never need release branches.
- **Versions and tags mark what users got.** They don't gate deploys.

**Semver, for what it means here:**

| Part                                    | Version                                                                                        | Tag                      | Rule                                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| Product (`apps/web`)                    | `0.x` during R0 → **`1.0.0` at R1 cutover** → minor per shipped feature batch, patch for fixes | `web@1.4.2`              | A major version only for a breaking change users notice (rare for a web app)                  |
| Public API                              | URL version `/api/v1` + `info.version` in OpenAPI                                              | —                        | Additive changes only inside `v1`. Breaking changes go to `/api/v2` with a deprecation period |
| `@wad/sdk`, CLI (R4+)                   | Strict semver, published to npm                                                                | `sdk@1.0.0`, `cli@1.0.0` | Breaking = major                                                                              |
| Internal packages (`core`, `ui`, `db`…) | Not versioned (private, `ignore` in Changesets)                                                | —                        | They ship with the app                                                                        |

**Tooling: Changesets** (monorepo-native, works with pnpm + Turbo). Chosen over release-please because it doesn't depend on commit message formats, which keeps our `WD-123 …` commit style.

1. **Each PR with a user-visible change** adds `.changeset/*.md`: bump type + one plain-language line, plus the Jira key.
   - Agents write it with `pnpm changeset`.
   - Internal-only PRs add `pnpm changeset --empty`.
   - The CI check `changeset status` fails a PR without one.
2. **The Changesets GitHub Action** keeps a "Version packages" PR open, collecting pending changes.
3. **Merging that PR:**
   - bumps versions and writes `CHANGELOG.md` per versioned package
   - creates **git tags** (`web@x.y.z`) and a **GitHub Release** with the notes
   - creates a **Sentry release** for the same version (with source maps)
   - marks the **Jira version** released through automation

   Merge it whenever a meaningful batch is live (roughly weekly, and always at R-milestones).

**Release notes, three audiences:**

| Audience            | Where                                       | Written how                                                                                                             |
| ------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Developers / agents | `CHANGELOG.md` + GitHub Releases            | Generated from changesets                                                                                               |
| Team / stakeholders | Confluence `WD › Release notes › web@x.y.z` | `/document-release` turns the GitHub Release into a page, grouped by epic, with Jira links (approval needed to publish) |
| Users (schools)     | In-app "What's new" (R2), `en`/`fr`         | Curated from changesets marked `user-facing`, in `packages/i18n`                                                        |

**Traceability:**

- The app footer and Settings show `v1.4.2 · <short sha>`.
- `/api/v1/health` returns the version.
- Sentry errors are grouped by release, so a regression points to its tag.
- **Rollback:** use Vercel instant rollback to the previous deployment. No re-tagging is needed, and the fix ships as a patch.

### 5.4 Definition of done (any task)

- [ ] `pnpm verify` is green
- [ ] New or changed components have stories (all states) with passing a11y
- [ ] New or changed service logic has Vitest coverage, including failure and authz cases
- [ ] The story has a UI e2e spec and, if it has backend logic, an API e2e test, both titled with the story ID
- [ ] Feature README, ADR or `docs/` are updated where behaviour or decisions changed
- [ ] No new lint suppressions without a justification
- [ ] A changeset is added (or `--empty` for internal-only changes)

---

## 6. Backend migration approach (NestJS → Next.js server layer)

### 6.1 Concept mapping

| NestJS                                              | Next.js platform                                                                                                                                     |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Module                                              | `packages/core/src/<domain>/` (logic) + `apps/web/src/features/<domain>/` (UI)                                                                       |
| Controller                                          | Server Actions (mutations) + `*.queries.ts` (reads). Route Handlers only for external callers                                                        |
| Service                                             | `*.service.ts`, mostly copy-ported. Plain functions taking `(ctx, input)` with no DI container                                                       |
| DTO + class-validator                               | Zod schema in `<domain>.schemas.ts`                                                                                                                  |
| `JwtGuard`                                          | `requireUser()` from `@wad/auth`                                                                                                                     |
| `MemberGuard`, `CanViewWorkspace`, `WorkspaceRoles` | `requireWorkspaceMember(slug, { roles, allowStatuses })` in `core/authz`                                                                             |
| `SuperAdminGuard`                                   | `requireSuperAdmin()`                                                                                                                                |
| `buildResponse` envelope                            | `Result<T> = { ok: true, data } \| { ok: false, code, message, fieldErrors? }` returned by `createAction`                                            |
| `SUCCESS_/ERROR_MESSAGES`                           | `core/errors.ts`, keeping the same kebab-case codes, translated on the client through `t('errors.<code>')`                                           |
| `EventEmitter2`                                     | `core/events.ts` typed bus, same event names                                                                                                         |
| `PrismaExceptionFilter`                             | Error mapping inside `createAction`                                                                                                                  |
| Swagger                                             | `@hono/zod-openapi` generates `/api/v1/openapi.json` + Scalar docs at `/api/v1/docs`                                                                 |
| Jest e2e specs                                      | Vitest integration tests calling services/actions against a test DB. **Every existing e2e case is ported** and tracked in `docs/migration/parity.md` |

### 6.2 Database

- Copy `schema.prisma` and the migration history. Treat the current production DB as the baseline (`prisma migrate resolve --applied` for existing migrations).
- Keep table names (`@@map`) and prefixed IDs exactly as they are, so the new app runs against the **same DB** as the old one during transition.
- Schema changes only happen through new migrations after cutover, or when they're backwards-compatible.

### 6.3 Auth migration

- Better Auth needs `user/session/account/verification` tables. Map them onto the existing `User` and `Account` models with field mapping, or add new tables and backfill. **Write an ADR first.**
- **R1: email code only.** Existing users sign in with their email, so no password migration is needed at cutover. That removes the biggest risk.
- **Email code rules:** 6 digits, valid 10 min, single use, max 5 attempts. Rate limited per email and per IP (resend cooldown 60 s). Sent with Resend through `packages/email`, localized. Responses never reveal whether an email has an account.
- The old password, email-confirmation and reset token tables are kept (read-only) until password sign-in returns (R2). Then argon2 `hash/verify` lets imported hashes work.
- **Later sign-in methods** (R2): password, WhatsApp code, Google and Apple, all linked to one `User`. Account linking only happens on a verified email or phone, never silently.
- **WhatsApp code (R2):**
  - Phone numbers are normalised to E.164 (`libphonenumber-js`, already used).
  - Codes expire after 5 min and have rate limits per phone and per IP, to stop SMS-pumping-style cost abuse.
  - Signing in with WhatsApp also counts as WhatsApp opt-in, reusing `Account.whatsappOptedInAt`.
  - Email code is the fallback if Meta delivery fails.
- **Apple (R2):** a Services ID, key and return URL. It handles Apple's private relay emails, and the user's name is only provided on the first sign-in.
- Sessions: database sessions with httpOnly cookies. `proxy.ts` only does an optimistic cookie check. Real checks happen in `requireUser()` on the server.

### 6.3b Who can call what (API access model)

Two separate front doors that never share credentials:

| Door                                              | Caller                              | Auth                                                                              | Notes                                                                                                                                                                                           |
| ------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Internal** (Server Actions, RSC, `/api/auth/*`) | Only our web app                    | Session cookie: `httpOnly`, `Secure`, `SameSite=Lax`, `__Host-` prefix            | No internal REST API is exposed. Server Actions are protected by Next.js origin checks and must not be called cross-origin. No CORS. Every action re-checks session and authz in `createAction` |
| **Public** (`/api/v1/*`, `/api/mcp`)              | Integrators, CLI, MCP, mobile later | **`Authorization: Bearer <api token>` only.** Cookies are ignored on these routes | Requires an account. Tokens are created in settings (R4). **Disabled until R4:** routes return `404`                                                                                            |

Honest limit: no server can prove that a request comes from _our_ frontend code. A signed-in user can always replay their own browser requests. What's guaranteed is that **nothing works without a valid user session or API token**, nothing works cross-origin, and everything is limited to that user's permissions and rate limits.

**API tokens** (Better Auth `apiKey` plugin):

- Format: `dance_<env>_<random>` (prefix helps GitHub secret scanning). Shown once, **stored hashed** (SHA-256). Only the prefix is shown afterwards.
- Belongs to a **user**. Optionally restricted to specific workspaces. Scopes like `members:read`, `events:write`. Effective permission = user's role in that workspace ∩ token scopes.
- Optional expiry, `lastUsedAt` tracking, instant revocation. Owners can see and revoke tokens with access to their school.
- Rate limited per token (Upstash) + Vercel Firewall rules. Every write is audit-logged with `ctx.via = 'api'` and the token id.
- `ctx` built from a token is the same shape as from a session, so `core` services don't care which door was used.

### 6.4 Background jobs and integrations

- Credit expiry and LAPSED transitions: `app/api/cron/*` route + Vercel Cron, protected by `CRON_SECRET`.
- WhatsApp webhook: `app/api/webhooks/whatsapp/route.ts` with signature verification. Outbound sends go through a queue with retries.
- Mail: `packages/email` (React Email, localized to the recipient's locale) behind a `core` mail port.

### 6.5 Public API and multi-client architecture (CLI, MCP, mobile)

Principle: **the core doesn't know who is calling it.** Server Actions, the REST API, the MCP server, cron and webhooks are thin adapters over the same services.

```
            ┌── Server Actions (web UI)
            ├── /api/v1  REST (Hono, OpenAPI) ──► CLI, mobile app, partners
core  ◄─────┼── /api/mcp  MCP server (mcp-handler / xmcp) ──► Claude, other agents
services    ├── /api/cron/*      (Vercel Cron)
            └── /api/webhooks/*  (WhatsApp, Stripe)
```

Rules:

- `packages/core` **never imports `next/*` or React** (lint + deps enforce it). `packages/api` is a plain Hono app, so `api + core + db` can be deployed outside Vercel unchanged.
- Services take an explicit `ctx` (`{ userId, workspaceId, role, via: 'web'|'api'|'mcp'|'cron' }`) instead of reading cookies or headers.
- **API auth:** personal API tokens only (§6.3b). The mobile app (R6) uses the `expo` plugin. An OAuth provider for MCP clients can be added later alongside tokens.
- **Contract:**
  - Zod schemas from `core/<domain>/<domain>.schemas.ts` are reused for both the OpenAPI spec and validation.
  - The URL is versioned (`/api/v1`). Breaking changes go to `/v2`.
  - Responses use the same envelope and error codes as actions.
- **Typed SDK:** `openapi-typescript` generates `packages/sdk` (published later) for the CLI and mobile app.
- **Rate limiting:** Vercel Firewall rules + Upstash Redis per API key.
- **Can Vercel run all of this?**
  - Yes for REST, MCP (Streamable HTTP), WebSockets, cron, queues, durable workflows and containerised services.
  - The only case that would need a host outside Vercel is a process that must stay always on (for example, a stateful socket broker).
  - If that ever comes up, the Hono app plus `packages/core` deploy as-is to Railway, Fly.io or Render (about $5–7/mo per small instance), still pointing at Neon.
- **Phasing:**
  - Phase 3 builds `ctx`, API-key auth and the Hono skeleton with `/api/v1/health`.
  - Each Phase 4 domain exposes its read and write endpoints, with OpenAPI tests.
  - The MCP server and CLI come after cutover.

### 6.6 Internationalisation and multi-currency (from day one)

**Languages**

- **Library:** `next-intl` in `apps/web`. Message catalogs live in `packages/i18n/messages/<locale>/<namespace>.json`, one namespace per feature, so mobile, CLI and email reuse them.
- **Locales:** `en` and `fr` at launch. `nl` is wired in but can ship later (Belgian market). English is the default and the fallback.
- **Locale resolution:**
  - App routes: user preference, then workspace default, then `Accept-Language`. Stored in a cookie, no URL prefix.
  - Marketing (B2C) routes: `/[locale]/…` prefix with `hreflang` for SEO.
- **Type-safe keys:** next-intl TS augmentation, so a missing key is a type error. `i18n-check` in CI catches keys missing in any locale.
- **No hardcoded UI strings:** `i18next/no-literal-string` lint on JSX. Design-system components take every string as a prop.
- **Errors:** `core` returns codes only. Clients render `t('errors.<code>')`.
- **Dates and numbers:**
  - Store timestamps in UTC (`timestamptz`).
  - Add `Workspace.timezone` (IANA), `Workspace.defaultLocale` and `User.locale`.
  - Format with next-intl's `useFormatter` / `Intl`, never by hand. `WeekStart` is kept.
- **User content** (event titles, material descriptions) is not translated, but it's stored with its language for future B2C search.
- **Emails** render in the recipient's locale.

**Currencies**

- **Money type** (`core/money`):
  - `{ amountMinor: number, currency: CurrencyCode }`, using ISO 4217 minor units (JPY has 0 decimals, EUR has 2).
  - **Never floats.** Arithmetic and allocation go through helpers (consider `dinero.js` v2 instead of a hand-rolled version, via an ADR).
- **Schema:**
  - `Price.amountCents` becomes `amountMinor` (backwards-compatible rename migration). `currency` is kept.
  - Add `Workspace.defaultCurrency`.
  - `Purchase` and `EntitlementTransaction` snapshot `amountMinor + currency` at the time of sale.
- **Model:**
  - Each workspace sells in its own currency (one or more Prices per Product, one per currency).
  - **No FX conversion in v1.** Reports group by currency. Platform-level analytics show totals per currency.
- **Display:** `formatMoney(money, locale)` uses `Intl.NumberFormat`. Currency comes from the data and locale from the viewer.
- **Payments (later):** Stripe charges in the Price's currency.

---

## 7. Migration roadmap (phased, each with exit criteria)

Order follows `api/docs/20260328_MASTER_IMPLEMENTATION_PLAN.md`. Member identity is the hard dependency.

### Phase 0: Foundation docs and decisions (no app code)

- Resolve the open decisions in §9 and write ADRs 0001–0005 (full-stack Next.js, auth, hosting/DB, state/data fetching, design direction).
- Write `AGENTS.md`, scoped `AGENTS.md` files, `docs/architecture.md`, `conventions.md`, `testing.md` and the skeleton of `design-system.md`.
- Build `docs/migration/parity.md`: every Nest endpoint and e2e case, plus every current web route, with a target and status column.
- Move `api/docs/*` → `docs/domain/`.
- **Workspace setup (needs your approval for each external write):**
  - Initialise the GitHub repo `KevinTss/wan-a-dance`: default branch `main`, branch protection, GitHub for Jira app.
  - Confluence `WD`: home page + page tree (Product, Plans, Decisions, Runbooks, Release notes). Publish the three draft docs.
  - Jira `WD`: versions R0–R6, R0 + R1 epics, R1 stories with acceptance criteria, statuses and automation (PR merged → Done).
  - Cloudflare: DNS for `wan-a.dance` → Vercel, Resend records (SPF/DKIM/DMARC), R2 bucket.
- **Exit:** docs reviewed with `/plan-eng-review` + `/plan-design-review`. Jira R1 backlog ready. Confluence space live.

### Testing strategy (all free, built in R0, required from R1)

**Principle:** every user story is proven at three levels: domain, API, UI. Every UI component is proven in isolation. Tests run against **real Postgres** and a **real browser**, never against mocks of our own code.

| Level                     | Scope                                                                                            | Tool                                                                                                     | Isolation                                                                                                                                                  | Gate                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Unit**               | Pure logic in `core` (money, recurrence, status machine, credit maths), `lib`, `i18n` formatters | Vitest (node)                                                                                            | None needed                                                                                                                                                | Coverage on `core`: ≥ 90% lines/branches                                                                                                                                 |
| **2. Integration**        | `core` services with Prisma: transactions, authz, events, cache tags                             | Vitest + Postgres (Testcontainers locally, service container in CI)                                      | **One database per worker**, cloned from a migrated template DB (`CREATE DATABASE … TEMPLATE`), truncated between tests                                    | Every service method: happy path, validation, authz denial, conflict/edge cases                                                                                          |
| **3. Component (atomic)** | Every `@wad/ui` primitive, pattern and layout, plus every domain component                       | Storybook stories run as tests through `@storybook/addon-vitest` (**Playwright Chromium**, browser mode) | Fixtures only, no network                                                                                                                                  | Each component: a story per variant and state, a `play` interaction test for every interactive behaviour (keyboard included), **axe a11y = error**                       |
| **4. Visual regression**  | Every story × light/dark × desktop/mobile + key app screens                                      | Playwright `toHaveScreenshot()` over Storybook `index.json`, run in the official Playwright Docker image | Fonts and animations frozen, fixed clock                                                                                                                   | 0 unexpected diffs. Baselines committed                                                                                                                                  |
| **5. API e2e**            | Every `/api/v1` endpoint and the auth endpoints, over real HTTP against the built app            | Vitest + `fetch` against `next start` (and Hono `app.request()` for speed) + Postgres                    | DB per worker, data built by factories, tokens minted by factories                                                                                         | Per endpoint: 401 (missing/invalid/expired/revoked token), 403 (role/scope), 400 (validation), 404, 409, happy path, response matches the OpenAPI schema, rate limit 429 |
| **6. UI e2e**             | Every user story through the real UI                                                             | Playwright: projects `chromium-desktop`, `chromium-mobile` × `en`, `fr` (nightly: + `firefox`, `webkit`) | Fresh seeded DB per worker. Email codes read from a **test mailbox** (mail adapter `capture` in test env). Logged-in state per role through `storageState` | Each story ID has ≥ 1 spec titled `[R1-XXX-NN] …`. axe check on every visited page. Zero flaky tests allowed (`--fail-on-flaky-tests` in CI)                             |
| **7. Smoke**              | Production after deploy: health, sign-in page, `/api/v1/health` version                          | Playwright (read-only)                                                                                   | —                                                                                                                                                          | Fails → Vercel instant rollback                                                                                                                                          |

**Supporting setup (built in R0):**

- `packages/testing`: Postgres harness (template DB + per-worker clone), **factories** for every model (`buildMember()`, `createWorkspaceWithOwner()`…), fixed clock, test mailbox reader, API token minting, Playwright fixtures (`asOwner`, `asTeacher`, `locale`).
- **Story coverage check:** `scripts/check-story-coverage.ts` parses `IMPLEMENTATION_PLAN.md`. For the current release, it fails CI if a story ID has no UI e2e spec or (when it has backend logic) no API/integration test with that ID in its title.
- **Deterministic tests:** fixed `TZ=UTC` plus explicit timezone tests, seeded faker, no `waitForTimeout`, role/label locators only (lint: `eslint-plugin-playwright`, `testing-library`).
- **API e2e in R1:** `/api/v1` routes for each R1 domain are built and tested in R1, authenticated with factory-minted API tokens. They stay **disabled in production** (`PUBLIC_API_ENABLED=false` → 404) until R4 ships token management. That gives full backend e2e now, and R4 only adds the token UI.
- **Speed budget:** unit+integration < 2 min. Component + visual < 4 min. Each e2e shard < 5 min (4 shards). Turbo cache skips untouched packages.
- **Nightly:** cross-browser e2e, **mutation testing** (Stryker) on `core` (score ≥ 70%), full visual run, dependency audit.
- **CI artefacts:** Playwright HTML report, traces and videos on failure, coverage summary, visual diff images, all attached to the PR.

No Chromatic or paid services. If baseline maintenance gets painful later, Chromatic can be added without changing the stories.

### Phase 1: Scaffold and guardrails

- `create-turbo` with pnpm, then `apps/web` (Next.js latest, TS strict, Tailwind v4, App Router, `src/`) plus the empty packages from §3, `packages/config` presets and Turbo remote cache.
- `next-intl` + `packages/i18n` with `en`/`fr` and the no-literal-string lint, set up before any UI is written.
- ESLint flat config + boundaries + restricted imports + tailwind rules, Prettier, knip, lefthook.
- Vitest workspace (unit + integration with a Postgres container), `apps/e2e` Playwright (journeys + visual + axe), `apps/storybook` (Storybook 10, `@storybook/nextjs-vite`, a11y, docs, vitest addon).
- `check-stories`, `check-docs` and `pnpm verify` scripts. Claude hooks and skills. CI workflow. PR template.
- **Exit:** an empty app deploys to a Vercel preview. CI is green. A deliberately broken import fails lint.

### Phase 2: Design system

- Design exploration (§4.5) → tokens → Foundations MDX.
- Primitives (curated shadcn, restyled to tokens) → Patterns → Layout (AppShell, Sidebar, CommandBar).
- `Screens/` stories: an empty app shell plus a sample list page using fixtures.
- **Exit:** every component has stories, interaction tests and passing a11y. Light and dark both verified. `/design-review` passes on Storybook.

### Phase 3: Server foundation

- `server/db`, `ids`, `errors`, `events`, `action` (`createAction`), `authz`, `mail`.
- Better Auth with email code only + sign-in page (email → code). Resend domain verified (SPF/DKIM/DMARC).
- **Exit:** auth e2e cases for email code, sessions, sign-out and rate limits are green. Existing users can sign in with their email (tested on a copy of production data). Password-related cases from the old suite are parked for R2.

### Phase 4: Domain migration (one PR series per domain)

Each domain follows the same `migrate-domain` checklist:

1. Read the Nest module, its README, e2e spec and the matching `docs/domain/*`.
2. Write `features/<x>/README.md` (rules, permissions, state machine).
3. Port the Zod schemas and the service. Port the tests **first** and make them pass.
4. Add queries (cached, tagged) and actions (`createAction`).
5. Add domain components with stories and fixtures, then pages composed from DS components.
6. Add a Playwright happy-path flow. Update `parity.md`.

Scope comes from [`FEATURES.md`](FEATURES.md). **Phase 4 ports only v1 features.** Deferred modules keep their DB tables. Their Nest code and e2e cases get ported when their release starts.

| #   | Domain (v1)                | Includes                                                                                  | Source tests                                  |
| --- | -------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------- |
| 4.1 | Accounts, workspaces, team | profile, create/switch workspace, settings (locale/currency/timezone), roles, invitations | user (profile parts), workspace 4, invitation |
| 4.2 | Members                    | CRUD, lifecycle + history, dance levels, filters                                          | member 62                                     |
| 4.3 | Schedule                   | one-off and recurring classes, calendar/list, capacity, leader/follower balance           | event 15                                      |
| 4.4 | Attendance                 | add attendees, present/absent, history                                                    | event/attendee subset                         |
| 4.5 | Credits (simple)           | products/prices, manual purchase, consume on attendance, adjustments ledger               | credits subset (add more)                     |
| 4.6 | Dashboard + emails         | weekly overview; verify/reset/invite emails                                               | —                                             |

v1.1 and v1.2 domains (materials, booking + cancellation, expiry cron, Stripe, notifications, public API, MCP, WhatsApp) each get their own phase after cutover, following the same checklist.

- **Exit per domain:** parity rows are green, `pnpm verify` passes, Playwright flow passes, README is written.

### Phase 5: Cutover

- Run the new app against the production DB in staging. Do a full QA pass (`/qa`) and a performance check (`/benchmark`).
- Switch the domain. Keep Nest read-only for one release as a rollback option. Then archive `api/` and `web-app/` repos and remove Render services.
- Run `/document-release` to refresh docs. Add a retro note.
- **Exit:** production on the new app, old services off, docs up to date.

### Later (out of scope for the migration)

The B2C layer: public school and event discovery, dancer profiles, partner matching. It goes under `(marketing)` and new features once the B2B parity is done.

---

## 8. Risks and mitigations

| Risk                                   | Mitigation                                                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Auth migration locks users out         | argon2 verify adapter. Rehearse on a production data copy. Keep the old app as rollback                                    |
| Behaviour drift from Nest              | Port every e2e case first. Parity matrix tracked in docs                                                                   |
| Design system becomes "shadcn default" | Curated primitive list, token-only lint rule, design review gate before features                                           |
| Agents ignore rules                    | Rules are enforced by lint, scripts, hooks and CI, not just prose                                                          |
| Caching bugs (stale data)              | Tag naming convention `<entity>:<workspaceId>` documented. Every action updates tags. Integration tests assert fresh reads |
| Scope creep (B2C, new features)        | Feature freeze during migration. New ideas go to the Jira backlog (label `idea`)                                           |

---

## 9. Decisions log

1. ~~Auth~~ → **Decided: Better Auth.** Reasons:
   - Users stay in our own Postgres (`User`/`Account`). No vendor and no per-user cost, which matters for the future B2C side.
   - Custom `generateId` keeps the prefixed IDs.
   - A custom argon2 `hash`/`verify` means existing users log in without resetting their password.
   - Built-in email verification, password reset, magic code (email or WhatsApp), Google + Apple sign-in and database sessions replace the custom JWT + refresh code.
   - Auth.js is now maintained by the Better Auth team and only gets maintenance updates. Clerk would move user data out of our DB and lock us into a vendor.
   - We don't use Better Auth's `organization` plugin. Workspaces, members and roles stay our own domain models.
2. ~~Hosting~~ → **Decided: Vercel Pro + Neon** (provisioned through the Vercel Marketplace, with one DB branch per preview deploy). Costs are in §10.
3. ~~Public API~~ → **Decided: yes.** A versioned `/api/v1` for the future CLI, MCP server and mobile app, designed so it can be moved off Vercel. Details in §6.5.
4. ~~Repo~~ → **Decided: Turborepo + pnpm monorepo** (§3).
5. ~~Visual regression~~ → **Decided: free stack.** Storybook test + Playwright screenshots, axe and e2e (§7, testing strategy).
6. ~~i18n / currency~~ → **Decided: `en` + `fr` at launch (`nl` ready), multi-currency with a per-workspace currency and no FX in v1** (§6.6).

**No open decisions left.** Next step: Phase 0.

---

## 10. Cost estimates

> Public list prices checked on **2026-10-10**, in USD, excluding VAT. These are estimates. Re-check the provider pages before committing. Usage-based lines depend on traffic assumptions, which are listed with each scenario.

### 10.1 Line items

| Category                               | Service                                                                                                                                                                                    | Plan / price                                                                                                                                                                    | Notes                                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Code hosting**                       | GitHub (`KevinTss/wan-a-dance`)                                                                                                                                                            | **Free**: unlimited private repos, 2,000 Actions min/mo. Team: $4/user/mo, 3,000 min                                                                                            | Free is enough solo. Move to Team for required reviewers and branch protection on private repos once collaborators join            |
| **CI/CD**                              | GitHub Actions + Vercel builds                                                                                                                                                             | Within the free minutes (estimate ~8 min/run × ~150 runs ≈ 1,200 min/mo). Vercel basic builds included, then $0.007/min                                                         | Cache pnpm, Playwright browsers and Turbopack output to stay under the limits                                                      |
| **AI for coding**                      | Claude Code                                                                                                                                                                                | Pro $20/mo ($17 annual) · **Max 5x $100/mo** · Max 20x $200/mo                                                                                                                  | Max 5x during the migration (heavy agent use). Drop to Pro afterwards. Token rules in §5.2b stretch every plan further             |
|                                        | Codex (optional second opinion via `/codex`)                                                                                                                                               | ChatGPT Plus ~$20/mo                                                                                                                                                            | Optional                                                                                                                           |
| **App hosting**                        | Vercel                                                                                                                                                                                     | Hobby $0 (**non-commercial only**, can't buy extra usage) · **Pro $20/seat/mo, includes $20 usage credit**: 1 TB transfer, 10M CDN req, 1M function invocations, 4 h active CPU | Hobby is fine while building. Pro is required for a paying product. Overage: transfer $0.15/GB, invocations $0.60/1M, CPU $0.128/h |
| **Database**                           | Neon Postgres                                                                                                                                                                              | **Free**: 100 CU-h/project, 1 GB/project, scales to zero · **Launch**: $0.106/CU-h + $0.35/GB-mo, no minimum · Scale: $0.222/CU-h                                               | Branch per preview (10 included). Scale-to-zero keeps idle cost near $0                                                            |
| **Auth**                               | Better Auth                                                                                                                                                                                | $0 (open source, data in Neon)                                                                                                                                                  |                                                                                                                                    |
| **Email**                              | Resend                                                                                                                                                                                     | Free: 3,000/mo (100/day) · Pro $20/mo: 50k · $35: 100k                                                                                                                          | Every sign-in sends an email in R1, so the 100/day free cap can be hit at launch. Switch to Pro as soon as a school is live        |
| **File storage**                       | Cloudflare R2                                                                                                                                                                              | ~$0.015/GB-mo, **$0 egress**, generous free tier (10 GB)                                                                                                                        | For materials and dance videos. Avoids bandwidth charges on Vercel                                                                 |
| **Errors / monitoring**                | Sentry                                                                                                                                                                                     | Free: 1 user, 5k errors/mo · Team $26/mo                                                                                                                                        | Free until there's a team                                                                                                          |
| **Product analytics**                  | Vercel Web Analytics (limited on Pro) or PostHog (free 1M events)                                                                                                                          | $0 to start                                                                                                                                                                     |                                                                                                                                    |
| **Storybook + visual tests**           | Storybook deployed as a Vercel project + Playwright screenshots in CI                                                                                                                      | $0                                                                                                                                                                              | No Chromatic                                                                                                                       |
| **Rate limiting**                      | Upstash Redis (Marketplace)                                                                                                                                                                | Free tier, then pay per request                                                                                                                                                 | Needed when `/api/v1` is opened up                                                                                                 |
| **Domain**                             | `wan-a.dance` on Cloudflare Registrar (at-cost)                                                                                                                                            | `.dance` renews at roughly $20–30/yr (check the Cloudflare dashboard)                                                                                                           | Cloudflare DNS for free. The old `danceapp.be` (GoDaddy) can redirect or lapse                                                     |
| **Knowledge base + delivery**          | Atlassian Confluence + Jira (`screenside` site)                                                                                                                                            | Free plan: up to 10 users each                                                                                                                                                  | Paid tier only if the team grows past 10 or needs advanced permissions                                                             |
| **WhatsApp** (reminders + login codes) | Meta Cloud API (direct, no BSP fee). Login codes are _authentication_ messages, priced about the same as utility. Needs Meta Business verification and an approved authentication template | Per delivered message. Belgium ≈ **$0.017–0.033 utility**, **$0.05–0.06 marketing**. Replies within 24 h are free                                                               | **Biggest variable cost.** Pass it through to schools or make it an opt-in add-on. Use email by default                            |
| **Payments** (future)                  | Stripe                                                                                                                                                                                     | Per transaction (EEA cards ~1.5% + €0.25)                                                                                                                                       | Paid by the transaction, not the platform budget                                                                                   |
| **Apple Developer Program**            | Apple                                                                                                                                                                                      | $99/yr                                                                                                                                                                          | Needed from **R2** for Sign in with Apple, and later for the iOS app                                                               |
| **Google OAuth**                       | Google Cloud                                                                                                                                                                               | $0                                                                                                                                                                              | Needs OAuth consent screen verification for production                                                                             |
| **Mobile** (future)                    | Google Play                                                                                                                                                                                | $25 once                                                                                                                                                                        | Only when the Android app ships                                                                                                    |
| **Extra host** (only if needed)        | Railway / Fly.io / Render                                                                                                                                                                  | ~$5–7/mo per small always-on instance                                                                                                                                           | Only for an always-on process Vercel can't run (§6.5)                                                                              |

### 10.2 Monthly scenarios

|                                          | **A. Build (now → cutover)** | **B. Launch** (≤10 schools, ~1k members, ~5k visits/mo) | **C. Growth** (~50 schools, ~10k members, public B2C pages) |
| ---------------------------------------- | ---------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| GitHub                                   | $0                           | $0                                                      | $0–12 (Team, 1–3 users)                                     |
| Claude Code                              | $100 (Max 5x)                | $20–100                                                 | $100–200                                                    |
| Vercel                                   | $0 (Hobby)                   | $20 (Pro, within credit)                                | $20–60                                                      |
| Neon                                     | $0 (Free)                    | ~$10 (≈90 CU-h + 2 GB)                                  | ~$40–80 (≈0.5 CU always on + 10–20 GB)                      |
| Resend                                   | $0                           | $0–20                                                   | $20–35                                                      |
| R2 storage                               | $0                           | ~$1                                                     | ~$5                                                         |
| Sentry                                   | $0                           | $0                                                      | $0–26                                                       |
| Domain (`.dance`)                        | ~$2                          | ~$2                                                     | ~$2                                                         |
| Apple Developer ($99/yr, from R2)        | $0                           | $0                                                      | ~$8                                                         |
| **Subtotal (platform)**                  | **≈ $100/mo**                | **≈ $50–150/mo**                                        | **≈ $200–430/mo**                                           |
| WhatsApp (variable)                      | $0                           | 2k utility msgs ≈ $35–65                                | 20k utility msgs ≈ $350–650                                 |
| WhatsApp login codes (variable, from R2) | $0                           | $0                                                      | ~5k codes ≈ $100–150                                        |

Takeaways:

- During the build, **AI tooling is ~100% of the cost**. Infrastructure stays on free tiers.
- At launch, the infrastructure is about **$30–50/mo**. That's comparable to today's Render setup, but with previews, branching DBs, cron and queues included.
- At growth, **WhatsApp and video bandwidth** are the main cost risks. R2 removes the video bandwidth risk. WhatsApp should be priced into the school subscription.
- Set **spend limits** on Vercel and Neon, and billing alerts everywhere, from day one.

### 10.3 Sources

[Vercel pricing](https://vercel.com/pricing) · [Neon pricing](https://neon.com/pricing) · [Claude pricing](https://claude.com/pricing) · [GitHub pricing](https://github.com/pricing) · [Resend pricing](https://resend.com/pricing) · [Sentry pricing](https://sentry.io/pricing/) · [WhatsApp Business Platform pricing](https://developers.facebook.com/docs/whatsapp/pricing) · [WhatsApp rate calculator (Belgium, Apr 2026 card)](https://whautomate.com/tools/whatsapp-business-api-pricing-calculator) · [Kanal 2026 country comparison](https://getkanal.com/blog/whatsapp-vs-sms-pricing-by-country)
