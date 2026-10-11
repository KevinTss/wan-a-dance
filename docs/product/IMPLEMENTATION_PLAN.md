# Dance App — Implementation Plan by Release

**Date:** 2026-10-11 · **Status:** Draft for review
**Related:** [MIGRATION_PLAN.md](MIGRATION_PLAN.md) (architecture, tooling, costs) · [FEATURES.md](FEATURES.md) (scope)
**Moves to:** Confluence space [`WD`](https://screenside.atlassian.net/wiki/spaces/WD/) in Phase 0. Stories become Jira issues in [`WD`](https://screenside.atlassian.net/jira/core/projects/WD)

> **Assumed event scope** (pending confirmation):
>
> - Weekly-only recurrence with an end date (12 months max).
> - Event types class / workshop / social, each with a credit cost.
> - Capacity is informational only.
> - Term courses are deferred to R2.

---

## How to read this

- **Roles:**
  - **Owner** (runs the school)
  - **Teacher** (staff)
  - **Student** (member)
  - **Dancer** (any public user)
  - **Admin** (platform super-admin)
  - **Integrator** (API/CLI/MCP user)
- **Story IDs** look like `R1-MEM-03`. They're referenced in PRs, tests and `docs/migration/parity.md`.
- **"Staff"** means Owner + Teacher.
- **Every story is done when:**
  - core service + unit/integration tests
  - `/api/v1` endpoint + API e2e (if it has backend logic)
  - UI from `@wad/ui`, with stories, interaction and a11y tests
  - a Playwright UI e2e spec titled `[ID]` in `en`/`fr` on desktop and mobile
  - docs updated

  The full Definition of Done is in MIGRATION_PLAN §5.4.

- **Each release ships behind a validation gate:** used by at least 2 real schools before the next release starts.

| Release | Theme                  | Who gets value                          |
| ------- | ---------------------- | --------------------------------------- |
| **R0**  | Foundation             | Developers and agents                   |
| **R1**  | Run my school          | Owners, teachers                        |
| **R2**  | Students join in       | + Students                              |
| **R3**  | Communicate and engage | Everyone, through reminders and content |
| **R4**  | Platform               | Integrators, AI agents                  |
| **R5**  | Public dance community | Dancers (B2C)                           |
| **R6**  | Mobile and scale       | Everyone on phones, admins              |

---

## R0 — Foundation (no end-user stories)

**Goal:** a deployable, empty, fully guarded monorepo with the design system ready.
**Maps to:** MIGRATION_PLAN Phases 0–3.

| #   | Milestone           | Output                                                                                                                                                                                                                                                             |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0.1 | Docs and decisions  | `AGENTS.md` (root + scoped), ADRs 0001–0006, `docs/*`, parity matrix                                                                                                                                                                                               |
| 0.2 | Monorepo scaffold   | Turborepo, `apps/web`, `apps/storybook`, `apps/e2e`, `packages/*`, CI, Vercel + Neon previews                                                                                                                                                                      |
| 0.3 | Guardrails          | ESLint boundaries, i18n lint, story/doc/agents-size checks, Claude hooks and skills, `pnpm verify`                                                                                                                                                                 |
| 0.4 | Design system       | Tokens (Dia-inspired), primitives, patterns, AppShell, ⌘K, Foundations docs, visual baselines                                                                                                                                                                      |
| 0.5 | Server foundation   | `core` (ctx, errors, ids, events, money, authz), `db` (baseline schema), `createAction`, `packages/email`                                                                                                                                                          |
| 0.6 | i18n and money      | `next-intl` (`en`/`fr`), `Money` type, locale/timezone/currency formatters                                                                                                                                                                                         |
| 0.8 | Test infrastructure | `packages/testing` (Postgres template DB per worker, factories, clock, mailbox, token minting), Vitest projects, Storybook test runner, Playwright (UI e2e, visual, API e2e, smoke), story-coverage check, CI sharding + reports (MIGRATION_PLAN testing strategy) |
| 0.7 | Releases            | Changesets + GitHub Action, `web@` tags, GitHub Releases, Sentry releases, Jira version automation, Confluence release-notes template (MIGRATION_PLAN §5.5)                                                                                                        |

**Developer stories**

- R0-DEV-01: As a developer, I run `pnpm dev` and get the web app, Storybook and a seeded local DB.
- R0-DEV-02: As a developer, I open a PR and get a preview URL with its own DB branch, plus CI results.
- R0-DEV-03: As an agent, I read `AGENTS.md`, and breaking a rule fails lint or CI with a clear message.
- R0-DEV-04: As a designer or developer, I browse every component, its states and light/dark themes in Storybook.
- R0-DEV-05: As a developer, merging the "Version packages" PR tags the release, publishes the GitHub Release and changelog, and creates the Sentry release.
- R0-DEV-07: As a developer, I run `pnpm test` (unit, integration, component), `pnpm test:e2e` (UI), `pnpm test:api` (API e2e) and `pnpm test:visual` locally with one command each, against a disposable Postgres.
- R0-DEV-08: As a reviewer, every PR shows test reports, traces, visual diffs, coverage and story coverage for the current release.
- R0-DEV-06: As a team member, I find the notes for each version on Confluence, linked to its Jira issues.

**Exit:** empty app deployed. CI green. Every design-system component has stories, a11y and visual baselines.

---

## R1 — Run my school

**Goal:** a school runs its weekly classes, attendance and credits without a spreadsheet.
**Exit:** one real school runs 4 consecutive weeks entirely in the app. The old app is switched off (cutover).

### Epic ACC — Accounts and sign-in

- R1-ACC-01: As a visitor, I can enter my email and receive a 6-digit code (sent with Resend) to sign up or sign in. No password.
- R1-ACC-02: As a visitor, a wrong or expired code shows a clear error. I can request a new code after a short cooldown.
- R1-ACC-03: As a user, I can edit my profile (name, avatar) and choose my language (`en`/`fr`).
- R1-ACC-04: As a user, I can sign out on this device or on all devices.
- R1-ACC-05: As an existing user of the old app, I sign in with the same email and find my data. No password migration is needed.

### Epic WS — School (workspace)

- R1-WS-01: As a user, I can create a school with a name and get its URL (`/w/<slug>`).
- R1-WS-02: As a user with several schools, I can switch between them from the sidebar or ⌘K.
- R1-WS-03: As an owner, I can set the dance styles taught, week start, default language, currency and timezone.
- R1-WS-04: As an owner, I can rename my school and change its slug (old links redirect).

### Epic TEAM — Team and invitations

- R1-TEAM-01: As an owner, I can invite a teacher by email.
- R1-TEAM-02: As an invitee, I can accept or decline an invitation from the email link, signing up if needed.
- R1-TEAM-03: As an owner, I can see pending invitations, resend them or revoke them.
- R1-TEAM-04: As an owner, I can change a team member's role or remove them.
- R1-TEAM-05: As a teacher, I can leave a school.

### Epic MEM — Members

- R1-MEM-01: As staff, I can see all members in a table with search, filters (status, dance style, level, role) and sorting.
- R1-MEM-02: As staff, I can add a member with name, and optionally email/phone, dance role (leader/follower/both) and notes.
- R1-MEM-03: As staff, I can edit or archive a member.
- R1-MEM-04: As staff, I can set a member's level for each dance style.
- R1-MEM-05: As staff, I can change a member's status (lead → trial → active → lapsed → deactivated), with an optional reason.
- R1-MEM-06: As staff, I can see a member's status history (who, when, why).
- R1-MEM-07: As staff, I can open a member panel showing profile, levels, attendance history and credit balance.

### Epic EVT — Schedule

- R1-EVT-01: As staff, I can create a one-off event: title, type (class/workshop/social), date, time, duration, location, dance style, optional level, optional capacity and credit cost.
- R1-EVT-02: As staff, I can make an event repeat weekly on chosen days until an end date (12 months max).
- R1-EVT-03: As staff, I can edit "this occurrence" or "this and following". Past occurrences stay unchanged.
- R1-EVT-04: As staff, I can cancel one occurrence or the rest of a series. Cancelled occurrences stay visible.
- R1-EVT-05: As staff, I can see upcoming events as a list grouped by day (default) or as a week view.
- R1-EVT-06: As staff, I can filter the schedule by type, dance style and level.

### Epic ATT — Attendance

- R1-ATT-01: As staff, I can open an occurrence and add members to it through search.
- R1-ATT-02: As staff, I can mark each attendee present or absent in one tap.
- R1-ATT-03: As staff, I can quick-add a walk-in by name only, which creates a `LEAD` member.
- R1-ATT-04: As staff, I can see live leader/follower counts and capacity during attendance.
- R1-ATT-05: As staff, I can see attendance history per occurrence and per member.
- R1-ATT-06: As staff, I see a "low/no credits" warning next to attendees.

### Epic CRD — Credits (manual)

- R1-CRD-01: As an owner, I can create products: class pack (N credits, optional expiry) or unlimited pass (X days), priced in the school currency.
- R1-CRD-02: As staff, I can record a purchase for a member (cash/transfer/other), which grants the credits or pass.
- R1-CRD-03: As staff, when I mark a member present, the event's credit cost is deducted automatically (oldest-expiring first; a valid pass costs nothing).
- R1-CRD-04: As staff, un-marking present gives the credits back.
- R1-CRD-05: As staff, I can adjust a balance (+/−) with a required reason.
- R1-CRD-06: As staff, I can see a member's credit ledger (every movement, never deleted).

### Epic DASH — Dashboard

- R1-DASH-01: As staff, I see today's and this week's events with attendee counts.
- R1-DASH-02: As staff, I see attendance this week compared with last week.
- R1-DASH-03: As staff, I see member counts by status.
- R1-DASH-04: As staff, I see members with low or no credits and can open them.

### Epic X — Cross-cutting

- R1-X-01: As a user, I can use the whole app in English or French.
- R1-X-02: As a user, I can use light or dark mode (system by default).
- R1-X-03: As a user, I can do everything on a phone browser.
- R1-X-04: As a user, I can navigate and run main actions from ⌘K.
- R1-X-05: As a user, I can see the app version in Settings and in the footer (for support).

### R1 implementation order

1. ACC (email code only, which removes the riskiest part of the migration: passwords)
2. WS, then TEAM
3. MEM
4. EVT
5. ATT
6. CRD
7. DASH
8. Cutover (MIGRATION_PLAN Phase 5)

---

## R2 — Students join in

**Goal:** students manage their own bookings and pay online. Staff work drops.
**Exit:** at least 50% of bookings in pilot schools are made by students themselves.

### Epic AUTH2 — More sign-in options

- R2-AUTH-01: As a visitor, I can sign up or sign in with Google.
- R2-AUTH-02: As a visitor, I can sign up or sign in with Apple.
- R2-AUTH-03: As a visitor, I can sign in with a 6-digit code sent to my WhatsApp number.
- R2-AUTH-04: As a user, I can set a password and sign in with it. Old-app argon2 hashes are accepted if we import them.
- R2-AUTH-05: As a user, I can reset my forgotten password.
- R2-AUTH-06: As a user, I can link several sign-in methods to my account and remove them (keeping at least one).

### Epic STU — Student portal

- R2-STU-01: As a student invited by my school (email, WhatsApp or link), I can claim my member profile and log in.
- R2-STU-02: As a student, I can see my upcoming bookings, my credits/pass and my attendance history.
- R2-STU-03: As a student in several schools, I can switch between them.
- R2-STU-04: As staff, I can link a walk-in member to a user account, keeping their history.

### Epic BOOK — Booking

- R2-BOOK-01: As a student, I can browse my school's schedule and book an occurrence (credits are reserved).
- R2-BOOK-02: As a student, I can cancel a booking. Credits come back according to the school's policy.
- R2-BOOK-03: As an owner, I can set the cancellation policy (full refund before N hours, partial % before M hours).
- R2-BOOK-04: As staff, I can override the policy for one event (for example, no refund for a workshop).
- R2-BOOK-05: As staff, capacity is now enforced for bookings, and I can still add people manually over capacity.
- R2-BOOK-06: As a student, I can join a waitlist when a class is full and get booked automatically when a spot frees up.
- R2-BOOK-07: As staff, bookings appear as pre-filled attendees, and I only confirm presence.

### Epic CRS — Term courses

- R2-CRS-01: As staff, I can create a course (a fixed group over N weeks) linked to a recurring event.
- R2-CRS-02: As staff or a student, I can enrol in the whole course in one action (one product or price for the course).
- R2-CRS-03: As staff, enrolled students are pre-filled on every occurrence of the course.

### Epic PAY — Online payments

- R2-PAY-01: As a student, I can buy a product online (Stripe Checkout) in the school's currency.
- R2-PAY-02: As an owner, I can connect my school's Stripe account.
- R2-PAY-03: As staff, I can refund a purchase. Unused credits are removed.
- R2-PAY-04: As a student, I receive a payment receipt by email in my language.

### Epic CRD2 — Credit lifecycle

- R2-CRD-01: As the system, expired credits and passes are expired nightly.
- R2-CRD-02: As the system, active members with no valid credits for N days become `LAPSED` (configurable).
- R2-CRD-03: As staff, I can grant free credits (gift, compensation) with a reason.

### Epic EVT2 — Schedule upgrades

- R2-EVT-01: As staff, I can repeat an event every N weeks and skip specific dates (holidays).
- R2-EVT-02: As staff, I can assign teachers to an event and filter the schedule by teacher.
- R2-EVT-03: As a user, I can see a month view.
- R2-EVT-04: As a teacher or student, I can subscribe to my schedule as an iCal feed.

### Epic ONB — Onboarding

- R2-ONB-03: As a user, I see a "What's new" panel after an update, in my language, and can reopen it from the help menu.
- R2-ONB-01: As an owner, I can import members from a CSV with column mapping and a preview.
- R2-ONB-02: As a user, I can use the app in Dutch.

---

## R3 — Communicate and engage

**Goal:** fewer no-shows, more engagement between classes.

### Epic NOTIF — Notifications

- R3-NOTIF-01: As a user, I see in-app notifications (bell + unread count) and can mark them read.
- R3-NOTIF-02: As a user, I can choose which notifications I get by email and WhatsApp.
- R3-NOTIF-03: As a student, I get a reminder before a booked class (email, or WhatsApp if opted in).
- R3-NOTIF-04: As a student, I'm notified when a class I booked is cancelled or changed.
- R3-NOTIF-05: As a student, I'm notified when my credits are low or about to expire.
- R3-NOTIF-06: As an owner, I can enable WhatsApp messaging for my school (paid add-on) and see usage and costs.
- R3-NOTIF-07: As staff, I can send a WhatsApp/email announcement to everyone booked in an occurrence.

### Epic MAT — Materials

- R3-MAT-01: As a teacher, I can upload or link a video or note and tag it with dance style and level.
- R3-MAT-02: As a teacher, I can share material with a class (all attendees) or with specific students.
- R3-MAT-03: As a student, I can see the materials shared with me and watch them in the app.
- R3-MAT-04: As a teacher, I can see who viewed each material.

### Epic ANA — Analytics

- R3-ANA-01: As an owner, I can see revenue per month (per currency) and by product.
- R3-ANA-02: As an owner, I can see retention: how many trials become active, and how many active members lapse.
- R3-ANA-03: As an owner, I can see fill rate and leader/follower balance per class over time.
- R3-ANA-04: As an owner, I can export members, attendance and purchases to CSV.

---

## R4 — Platform

**Goal:** the school's data is reachable by tools, scripts and AI agents.

### Epic API — Public API

- R4-API-01: As a signed-in user, I can create a personal API token in my settings: name, scopes (`read` / `write` per resource), the schools it can access, and an optional expiry.
- R4-API-02: As a user, I see the token only once at creation. Afterwards I see its name, prefix, scopes, creation date and last-used date.
- R4-API-03: As a user, I can revoke a token, and it stops working immediately.
- R4-API-04: As an integrator, I call `/api/v1` with `Authorization: Bearer <token>`. I can do exactly what my account can do in those schools, limited by the token's scopes.
- R4-API-05: As an integrator, I can read and write members, events, attendance and purchases, with OpenAPI docs at `/api/v1/docs`.
- R4-API-06: As an integrator, I get `429` responses with retry headers when I exceed the rate limit for my token.
- R4-API-07: As an owner, I can see and revoke API tokens that have access to my school.
- R4-API-08: As an integrator, I receive webhooks (member created, booking created, purchase paid).
- R4-API-09: As an integrator, I use a typed SDK (`@wad/sdk`).

### Epic MCP — AI agents

- R4-MCP-01: As a user, I can connect Claude (or another MCP client) to my account with an API token, or later through OAuth.
- R4-MCP-02: As a teacher, I can ask an agent "who's coming tonight?" or "add Maria to Thursday salsa", and it acts with my permissions.

### Epic CLI

- R4-CLI-01: As an integrator, I can log in from the CLI and list, create or export school data.

---

## R5 — Public dance community (B2C)

**Goal:** dancers discover schools and events. Schools get new leads.

### Epic PUB — Public pages

- R5-PUB-01: As an owner, I can publish a public school page (description, styles, schedule, location, prices).
- R5-PUB-02: As a dancer, I can find schools and events by city, dance style and date.
- R5-PUB-03: As staff, I can mark an event public, with a shareable page and SEO in multiple languages.
- R5-PUB-04: As a dancer, I can register for a public event or trial class. A `LEAD` member is created automatically in that school.
- R5-PUB-05: As an owner, I can follow leads from public registrations to trial to active (funnel).

### Epic DNC — Dancer profiles

- R5-DNC-01: As a dancer, I can create a public profile (styles, levels, role, city).
- R5-DNC-02: As a dancer, I can follow schools and get their public events.

### Epic PART — Partner matching

- R5-PART-01: As a dancer, I can say I'm looking for a partner (style, level, role, city).
- R5-PART-02: As a dancer, I can see compatible dancers and send a contact request, which they must accept before any contact details are shared.

### Epic MKT — Materials marketplace

- R5-MKT-01: As a teacher, I can publish materials to a cross-school marketplace (free or paid).
- R5-MKT-02: As a teacher or dancer, I can browse and acquire marketplace materials.

---

## R6 — Mobile and scale

### Epic MOB — Mobile app (Expo)

- R6-MOB-01: As a student, I can do everything from the student portal in a native app (book, cancel, credits, materials).
- R6-MOB-02: As a teacher, I can take attendance in the app, including on spotty connectivity (offline queue).
- R6-MOB-03: As a user, I receive push notifications instead of, or in addition to, email/WhatsApp.
- R6-MOB-04: As a student, I can check in by scanning the class QR code.

### Epic ADM — Platform admin

- R6-ADM-01: As an admin, I can search users and schools and see their status.
- R6-ADM-02: As an admin, I can impersonate a user for support (audited).
- R6-ADM-03: As an admin, I can soft-delete a user or school and export their data (GDPR).

### Epic SCALE — Multi-location

- R6-SCALE-01: As an owner, I can manage several locations and rooms, and assign events to them.
- R6-SCALE-02: As an owner, I can see teacher hours per period for payroll.

---

## Story count by release

| Release | Stories |
| ------- | ------- |
| R0      | 8 (dev) |
| R1      | 48      |
| R2      | 34      |
| R3      | 15      |
| R4      | 12      |
| R5      | 11      |
| R6      | 9       |

## Not planned

Own invoicing/accounting, chat between members, currency conversion (FX), social feed.
