# Dance App — Feature Scope

**Date:** 2026-10-10 · **Status:** Draft for review
**Moves to:** Confluence space [`WD`](https://screenside.atlassian.net/wiki/spaces/WD/) in Phase 0. Stories become Jira issues in [`WD`](https://screenside.atlassian.net/jira/core/projects/WD)
**Rule for agents:** build only what is listed under the current release. Anything else needs this file updated first.

---

## 1. Product in one sentence

Dance schools run their weekly classes in one calm place: who their students are, who came, and who has paid.

## 2. Who it's for (v1)

| Role        | Who             | Main job                                                                                |
| ----------- | --------------- | --------------------------------------------------------------------------------------- |
| **Owner**   | Runs the school | Set up the school, invite teachers, see how the school is doing                         |
| **Teacher** | Teaches classes | Run the schedule, take attendance, manage students                                      |
| **Student** | Takes classes   | v1: exists as a member record and doesn't need to log in. Gets their own portal in v1.1 |

Out of scope for now: independent dancers (B2C), event organisers, partners.

## 3. Scoping principles

1. **One core loop first:** _add students → schedule classes → take attendance → track credits_. Everything in v1 serves this loop.
2. **Teacher-side first.** Staff do everything in v1. Student self-service comes after real schools have used it.
3. **Manual before automated.** Record a cash or bank-transfer payment before integrating Stripe. Use email before WhatsApp.
4. **Schema can be ahead of the UI.** The existing DB tables for deferred features (WhatsApp, materials, marketplace…) stay, but their code isn't ported until their release.
5. **Each release is validated with at least 2 real schools** before the next starts.

---

## 4. Release v1 — "Run my school" (migration target)

### 4.1 Accounts

- Sign up and sign in with a **6-digit code sent by email** (Resend). No password. The email is verified by the code itself.
- Profile (name, avatar, language). Sign out on this device or all devices.
- **Later:** Google, Apple, WhatsApp code, password, account linking. **Not doing:** GitHub OAuth, 2FA (for now).

### 4.2 Workspace (the school)

- Create a school (name → slug URL `/w/<slug>`). Switch between schools.
- Settings: name, dance styles taught, week start, **default language, currency and timezone**.
- **Not now:** branding, custom domain, delete-with-export.

### 4.3 Team and invitations

- Owner invites teachers by email. Invite accept/decline flow.
- Roles: `OWNER`, `TEACHER`, `STUDENT`. One permission matrix, documented in `core/workspace/README.md`.
- **Not now:** custom roles, multiple owners transfer flow.

### 4.4 Members (students)

- List with search, filter by status, dance style and level, and sort.
- Create and edit: name, email/phone (optional; walk-ins have no account), dance role (leader/follower/both), notes.
- **Lifecycle status:** `LEAD → TRIAL → ACTIVE → LAPSED → DEACTIVATED`, with a status history. Only staff change it.
- **Level per dance style** (for example, Salsa: intermediate, Bachata: beginner).
- Member detail panel: profile, status history, attendance, credit balance.
- **Not now:** CSV import (v1.1), automatic LAPSED (comes with credit expiry), linking a walk-in to a user account (v1.1).

### 4.5 Schedule (classes and events)

- Create one-off or **recurring** classes (weekdays, end date or number of occurrences).
- Fields: name, dance styles, level, location, start/end, capacity, **leader/follower balance**.
- Week calendar view and list view. Edit or cancel a single occurrence or the whole series.
- **Not now:** public event pages, rooms/resources, teacher assignment per class, iCal export (v1.1).

### 4.6 Attendance

- From a class, staff add members and mark them `present` / `absent`.
- Leader/follower count shown live against the balance target.
- Attendance history per member and per class.
- **Not now:** student self-booking, waitlist, QR check-in.

### 4.7 Credits (simple)

- **Products:** class pack (N credits, optional expiry in days) or unlimited pass (valid for X days). Price in the school's currency.
- **Record a purchase** manually (cash, transfer, other) and it creates credits for the member.
- **Marking someone present uses 1 credit** automatically (oldest-expiring first). An unlimited pass uses none.
- Balance on the member panel. A "low/no credits" badge in lists and attendance.
- Manual adjustment (+/−) with a required reason. Kept in a ledger and never deleted.
- **Not now:** online payment, refunds, cancellation restore policies, automatic expiry job (v1.1).

### 4.8 Dashboard

- Today's and this week's classes.
- Attendance this week compared with last week.
- Members by status.
- Members with low or no credits.
- **Not now:** revenue charts, retention cohorts, exports.

### 4.9 Notifications (email only)

- Transactional emails only: verify email, reset password, invitation.
- **Not now:** class reminders, in-app notification centre, WhatsApp.

### 4.10 Cross-cutting (built into everything)

- `en` + `fr` UI. Money and dates formatted per locale and timezone.
- Light/dark mode. Usable on mobile (responsive). ⌘K command bar.
- Accessibility: AA.

**v1 is done when** a real school runs 4 consecutive weeks of classes, attendance and credits in it without falling back to a spreadsheet.

---

## 5. Release v1.1 — "Students join in"

| Feature                     | Summary                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Student portal              | Students log in, see their schedule, credits and history                                                                 |
| Self-booking + cancellation | Book a class (uses a credit), cancel with the workspace restore policy (full/partial before N hours, per-event override) |
| Waitlist                    | Automatic promotion when a spot frees up                                                                                 |
| Credit expiry job           | Nightly cron expires credits. Members with no valid credits become `LAPSED`                                              |
| Online payments             | Stripe Checkout for products, in multiple currencies. Refunds                                                            |
| Materials                   | Teachers share videos and notes with a class or student. Stored on R2. "Viewed" tracking                                 |
| In-app notifications        | Bell + unread count + email preferences                                                                                  |
| CSV import, iCal feed       | Onboarding and calendar sync                                                                                             |
| `nl` language               | Dutch translation                                                                                                        |

## 6. Release v1.2 — "Platform"

| Feature              | Summary                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------- |
| Public API `/api/v1` | Personal API tokens (an account is required, scoped and revocable), OpenAPI docs, rate limits |
| MCP server           | Agents can query the schedule, members and attendance as the user                             |
| CLI                  | Built on the SDK                                                                              |
| Class reminders      | Email first. **WhatsApp** as a paid add-on (per-message cost, see plan §10)                   |

## 7. Later (ideas, not planned)

- **B2C:** public school pages, event discovery, dancer profiles, partner matching, trial-class funnel with automatic LEAD creation.
- Mobile app (Expo).
- Materials marketplace across schools.
- Advanced analytics (revenue, retention).
- Multi-location schools, rooms, payroll for teachers.
- Super-admin console (until then: Neon console / Prisma Studio).

## 8. Explicitly not doing

- Our own payment processing or invoicing/accounting. Use Stripe and export.
- Chat between members.
- Currency conversion (FX).
- Social feed.

---

## 9. Where existing code lands

| Existing (old repos)                           | Release                        |
| ---------------------------------------------- | ------------------------------ |
| Auth (email, Google), user profile             | v1                             |
| GitHub OAuth                                   | Dropped                        |
| Workspace + config, invitations                | v1                             |
| Members, lifecycle + history, dance levels     | v1                             |
| Events (one-off + recurring), attendees        | v1                             |
| Credits: products, prices, purchases, grants   | v1 (manual, simplified)        |
| Credits: booking, cancellation restore, expiry | v1.1                           |
| Materials + sharing                            | v1.1                           |
| Notifications                                  | v1 email only · in-app in v1.1 |
| WhatsApp messaging + webhook                   | v1.2                           |
| Materials marketplace                          | Later                          |
| Super-admin user management                    | Later                          |
| Subscriptions page (old web app)               | Replaced by Credits            |
