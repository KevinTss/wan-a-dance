# Member Identity & Lifecycle Plan

**Date:** 2026-03-28
**Status:** Design approved — ready for implementation planning

---

## 1. Problem Statement

The current `Member` model conflates two separate concepts:

| Concept           | Meaning                                            | Current state            |
| ----------------- | -------------------------------------------------- | ------------------------ |
| **Roster slot**   | "This person is tracked by this school"            | Handled by `Member`      |
| **Access ticket** | "This person can log in and see workspace content" | Also handled by `Member` |

This creates a hard mandatory chain:

```
attend event → must be a Member → Member must have userId → userId must be authenticated
```

This breaks the moment you want anyone who is not already enrolled to attend a public event, and it provides no CRM visibility into leads, trials, or people who attended once and never came back.

---

## 2. Core Decision

> **A `Member` record is always created when someone first participates in a workspace event, regardless of whether they are enrolled.**

This single decision:

- Keeps `Attendee.memberId` required and non-nullable (no schema split)
- Gives teachers a unified CRM view of every person who ever touched the school
- Makes the credit and entitlement system cleanly Member-scoped
- Replaces a complex three-path attendance model with a single status field

`Member.status` becomes the source of truth for where a person is in their relationship with the school.

---

## 3. Member Status Lifecycle

### 3.1 Status definitions

| Status        | Meaning                                                                                                              | Who has it                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `LEAD`        | Person attended a public event, was manually added, or expressed interest. No ongoing relationship, no entitlements. | External attendees, walk-ins, teacher-added contacts |
| `TRIAL`       | Attended at least one trial class. School-designated trial event.                                                    | Students who tried once                              |
| `ACTIVE`      | Has at least one active entitlement (credit pack, cohort pass, etc.).                                                | Paying/regular students                              |
| `LAPSED`      | Was ACTIVE, all entitlements have expired.                                                                           | Former students                                      |
| `DEACTIVATED` | Manually blocked by school. Cannot attend or register.                                                               | Removed/banned members                               |

### 3.2 Transition diagram

```
First participation (public event / manual add / walk-in)
         │
         ▼
       LEAD ──── attends trial class ──────────────────► TRIAL
         │                                                  │
         │                                                  │
         └──────── buys any product ─────────────────► ACTIVE ◄──── buys again
                                                          │
                                                          │ all entitlements expire
                                                          ▼
                                                        LAPSED
                                                          │
                                                          │ buys again
                                                          └──────────► ACTIVE

Any status ──── teacher blocks ──────────────────────► DEACTIVATED
```

### 3.3 Transition triggers

| From     | To            | Trigger                                                                     |
| -------- | ------------- | --------------------------------------------------------------------------- |
| _(new)_  | `LEAD`        | Self-registration on public event, teacher manual add, walk-in registration |
| `LEAD`   | `TRIAL`       | Attends event with `type: TRIAL`                                            |
| `LEAD`   | `ACTIVE`      | Purchase confirmed (any product)                                            |
| `TRIAL`  | `ACTIVE`      | Purchase confirmed (any product)                                            |
| `ACTIVE` | `LAPSED`      | Scheduled job: all `EntitlementGrant` records expired or consumed           |
| `LAPSED` | `ACTIVE`      | Purchase confirmed                                                          |
| Any      | `DEACTIVATED` | Teacher/owner manual action                                                 |

**Status is never set manually by teachers except for `DEACTIVATED`.** Every other transition is triggered by system events (booking, payment, expiry job).

---

## 4. Data Model Changes

### 4.1 `MemberStatus` enum — replace existing (currently unused)

```prisma
// Replace the current MemberStatus enum (ACTIVE | DEACTIVATED — never used)
enum MemberStatus {
  LEAD
  TRIAL
  ACTIVE
  LAPSED
  DEACTIVATED
}
```

### 4.2 `Member` model additions

```prisma
// Add to existing Member model:
status          MemberStatus @default(LEAD)
statusUpdatedAt DateTime     @default(now()) @db.Timestamptz(3)

// Source of first contact — for CRM / lead attribution
acquisitionSource AcquisitionSource @default(MANUAL)
acquisitionEventId String?   // Event.id that triggered auto-creation (if applicable)

@@index([workspaceId, status])
```

```prisma
enum AcquisitionSource {
  PUBLIC_EVENT    // auto-created when registering for a public event
  TRIAL_CLASS     // auto-created at trial class registration
  MANUAL          // teacher added manually
  INVITATION      // joined via workspace invitation link
  SELF_SIGNUP     // user found and joined the workspace themselves (future)
}
```

### 4.3 `canAccessWorkspace` guard — one-line fix

The guard must exclude `LEAD` and `DEACTIVATED` members from workspace access.

```typescript
// workspace.service.ts — canAccessWorkspace
members: {
  some: {
    userId: user.id,
    workspaceId: workspace.id,
    deletedAt: null,
    status: { notIn: [MemberStatus.LEAD, MemberStatus.DEACTIVATED] },
  },
},
```

A LEAD member exists on the roster but cannot access private workspace content, private events, or the member list.

### 4.4 `Attendee` — no changes needed

`Attendee.memberId` stays required and non-nullable. The Member is always created first, then the Attendee is created against it. No three-path model needed.

### 4.5 Walk-in member (no account)

`Member.userId` is already optional. A teacher-added walk-in creates:

```
Member {
  userId: null           // no platform account
  status: LEAD
  name: "John Smith"
  phone: "+33612345678"
  acquisitionSource: MANUAL
}
```

When the person later creates a platform account, the teacher links them:

```
PATCH /workspaces/:slug/members/:memberId
Body: { userId: "user_xxx" }
```

Past attendance history is preserved — the `Attendee` records already reference this `memberId`.

---

## 5. Auto-Creation Flow (Public Event Registration)

```
User (authenticated) requests to register for PUBLIC event
          │
          ▼
Does Member(userId=user.id, workspaceId) already exist?
          │
    YES ──┴── NO
    │          │
    │          ▼
    │    Create Member {
    │      status: LEAD
    │      acquisitionSource: PUBLIC_EVENT
    │      acquisitionEventId: event.id
    │    }
    │          │
    └──────────┤
               ▼
        Create Attendee { memberId }
               │
               ▼
        Paid event? → Purchase flow → EntitlementGrant(DROP_IN_PASS)
        Free event? → Done
```

Deduplication is a single `findFirst(userId, workspaceId)` before creation. If the member already exists at any status, reuse the record and do not reset the status.

---

## 6. Pricing by Member Status (Public Events)

When a person registers for a paid public event, the system checks their status to determine the price:

```
Event {
  publicPrice:  Decimal   // price for LEAD / no-member
  memberPrice?: Decimal   // optional discounted price for TRIAL/ACTIVE members
}
```

At registration:

- Status `ACTIVE` or `TRIAL` → apply `memberPrice` (if configured)
- Status `LEAD` or no existing Member → apply `publicPrice`
- School can optionally configure LEAD to also get `memberPrice` (to incentivize conversion)

A LEAD attending a paid public event does NOT consume a studio credit. They pay the ticket price directly. Only ACTIVE/TRIAL members can use their credit pack entitlements on events that accept them.

---

## 7. WhatsApp Notification Gating by Status

Each notification template has a `minStatusRequired` field. This prevents LEAD members from being enrolled in class-reminder campaigns they never opted into.

| Template                | Min status | Rationale                                             |
| ----------------------- | ---------- | ----------------------------------------------------- |
| `booking_confirmation`  | `LEAD`     | Anyone who books should get confirmation              |
| `class_reminder`        | `TRIAL`    | Reminders only for people with a real class scheduled |
| `credit_expiry_warning` | `ACTIVE`   | Only people with credits                              |
| `win_back`              | `LAPSED`   | Re-engagement for former students                     |
| `announcement`          | `TRIAL`    | Only people with some relationship to the school      |

---

## 8. User Stories

### 8.1 Student / Participant

**Public event access**

- As an authenticated user, I can register for a public event at any studio without being a member of that studio.
- As an authenticated user, if I register at a studio for the first time, the system creates a contact record for me at that studio automatically.
- As an authenticated user, I can see which studios have me as a contact and what my status is at each.
- As an authenticated user, I can pay for a public event ticket without having a credit pack.
- As a member of Studio A, I can get a discounted price on a public event at Studio A compared to non-members.
- As an ACTIVE member of Studio A, I can use my existing credits on a Studio A event if the school allows it.

**Trial class**

- As an authenticated user, I can register for a trial class at a studio.
- As a student, when I attend a trial class my status at the studio automatically becomes TRIAL.
- As a student, I can see that my trial has been recorded and that I am now recognized by the school.

**Enrolled student**

- As a student, when I purchase any product my status automatically becomes ACTIVE.
- As a student, when all my entitlements expire my status becomes LAPSED and I am notified.
- As a LAPSED student, I can re-purchase and become ACTIVE again without any manual action from the teacher.
- As a student, I can see my full history: events attended, purchases, entitlements, status changes.

**Walk-in (no account)**

- As a walk-in, a teacher can add me to the roster with just my name and phone number.
- As a walk-in, I appear as a LEAD member on the school's roster immediately.
- As a walk-in, if I later create a platform account, my past attendance history is preserved when the teacher links my account.

---

### 8.2 Teacher

**CRM and lead tracking**

- As a teacher, I can see all LEADs: people who attended a public event or were added manually but never enrolled.
- As a teacher, I can see all TRIALs: people who tried at least one class.
- As a teacher, I can see all ACTIVE students and their current entitlements.
- As a teacher, I can see all LAPSED students so I can run re-engagement campaigns.
- As a teacher, I can filter the member list by status (LEAD / TRIAL / ACTIVE / LAPSED).
- As a teacher, I can see where each member came from (public event, trial, invitation, manual add).
- As a teacher, I can see which public event triggered a member's creation.
- As a teacher, I can see the full attendance history for any member regardless of status.
- As a teacher, I can manually add a walk-in member with just a name and contact info.
- As a teacher, I can link a walk-in member to their platform account when they eventually create one.
- As a teacher, I can deactivate a member and prevent them from registering for any future events.
- As a teacher, I can reactivate a deactivated member.

**Conversion and manual actions**

- As a teacher, I cannot manually set a member's status to TRIAL or ACTIVE — those are triggered by the system based on real events and purchases.
- As a teacher, I can grant a LEAD or TRIAL student a free trial entitlement to encourage them to book a class (via the entitlement grant system).

---

### 8.3 School Admin / Owner

**Configuration**

- As a school admin, I can configure whether public events auto-create LEAD member records.
- As a school admin, I can configure a `memberPrice` on public events for TRIAL/ACTIVE members.
- As a school admin, I can decide whether LEAD members also receive the member price on public events.
- As a school admin, I can define which event types count as "trial classes" for the LEAD → TRIAL transition.
- As a school admin, I can export the full member list filtered by status for reporting.

**Visibility and audit**

- As a school admin, I can see total LEADs, TRIALs, ACTIVEs, and LAPSED at any point in time.
- As a school admin, I can see the conversion rate from LEAD → TRIAL and TRIAL → ACTIVE over a time period.
- As a school admin, I can see which public events generate the most LEAD entries (acquisition channel analytics).
- As a school admin, I can see the full status history of any member (when they transitioned and why).

---

### 8.4 System

- As the system, I automatically create a LEAD member record when an authenticated user registers for a public event at a workspace where they have no existing member record.
- As the system, I deduplicate member creation — I never create two Member records for the same (userId, workspaceId) pair.
- As the system, I transition a LEAD or TRIAL member to ACTIVE immediately when a purchase is confirmed.
- As the system, I transition an ACTIVE member to LAPSED when a scheduled job detects all their entitlements have expired or been consumed.
- As the system, I never downgrade a status unless triggered by a real event (expiry) or manual deactivation.
- As the system, I record the timestamp and reason for every status transition.
- As the system, I gate workspace content access: LEAD and DEACTIVATED members cannot access private workspace endpoints.
- As the system, I gate WhatsApp notification delivery: each template has a minimum status requirement.

---

## 9. Implementation Epics

### Epic 1 — Member status lifecycle (foundation)

Everything else depends on this.

**Stories:**

- Add `MemberStatus` enum to schema (`LEAD | TRIAL | ACTIVE | LAPSED | DEACTIVATED`)
- Add `AcquisitionSource` enum to schema
- Add `status`, `statusUpdatedAt`, `acquisitionSource`, `acquisitionEventId` columns to `Member`
- Backfill migration: set all existing `Member` records to `ACTIVE` (they were manually enrolled)
- Fix `canAccessWorkspace` to exclude `LEAD` and `DEACTIVATED`
- Add `MemberStatusHistory` table for full audit trail (required in v1 — needed for trust and troubleshooting)
- Update `member.e2e.spec.ts` to cover status-based access control
- Update member README

---

### Epic 2 — Auto-creation of LEAD on public event registration

Depends on Epic 1.

**Stories:**

- Add `isPublic` check to event registration endpoint
- Implement `findOrCreateLeadMember(userId, workspaceId, eventId)` in MemberService
- Auto-create LEAD member before creating Attendee for PUBLIC events
- Skip auto-creation for WORKSPACE/PRIVATE events (return 403 if not already a member)
- Add e2e tests: external user registers for public event → LEAD created → Attendee created
- Add e2e tests: existing member registers for public event → no duplicate Member created

---

### Epic 3 — Walk-in and account linking

Depends on Epic 1.

**Stories:**

- Ensure `POST /workspaces/:slug/members` can create a member with no `userId` (already works — add explicit test)
- Add `PATCH /workspaces/:slug/members/:memberId` to support linking a `userId` (already exists — add `userId` to `UpdateMemberDto`)
- Add deduplication guard: cannot link a `userId` that is already linked to another active member in this workspace
- Add e2e tests: create walk-in → link account → attendance history preserved

---

### Epic 4 — LEAD → TRIAL status transition

Depends on Epics 1 + 2.

**Stories:**

- Add `isTrial: boolean` flag to `Event` model (or configure at `Product` level)
- On booking creation: if `event.isTrial = true` and member status is `LEAD` → transition to `TRIAL`
- Record transition in `MemberStatusHistory`
- Add e2e test: LEAD attends trial class → status becomes TRIAL

---

### Epic 5 — Status-driven analytics endpoints

Depends on Epics 1–4.

**Stories:**

- `GET /workspaces/:slug/members?status=LEAD` — filter by status (add to `SearchMembersDto`)
- `GET /workspaces/:slug/members/stats` — counts by status + conversion rates
- `GET /workspaces/:slug/members/:memberId/status-history` — full audit trail

---

### Epic 6 — ACTIVE → LAPSED scheduled job

Depends on Epic 1 + Credits system (separate epic).

**Stories:**

- Scheduled job: daily, find all ACTIVE members with zero active EntitlementGrants → transition to LAPSED
- Send WhatsApp `win_back` notification on LAPSED transition (if opted in)
- Add e2e test: mock time, expire all entitlements → member becomes LAPSED

---

## 10. MVP Scope (v1)

Minimum to unblock the credits system and public event registration:

| Epic                                      | v1  | v2  |
| ----------------------------------------- | --- | --- |
| Epic 1 — Status lifecycle + guard fix     | ✅  |     |
| Epic 1 — MemberStatusHistory audit table  | ✅  |     |
| Epic 2 — Auto-create LEAD on public event | ✅  |     |
| Epic 3 — Walk-in + account linking        | ✅  |     |
| Epic 4 — LEAD → TRIAL transition          | ✅  |     |
| Epic 5 — Status filter on member list     | ✅  |     |
| Epic 5 — Analytics/stats endpoint         |     | ✅  |
| Epic 5 — Status history endpoint          | ✅  |     |
| Epic 6 — LAPSED scheduled job             |     | ✅  |
| WhatsApp gating by status                 |     | ✅  |
| Acquisition source analytics              |     | ✅  |

---

## 11. Decisions

| #   | Question                                                                                        | Decision                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Should auto-creation of LEAD be opt-in per workspace?                                           | **Yes** — `WorkspaceConfig.autoCreateLeads: boolean`, default `true`. Add to existing workspace config model.                                                                                                                                                                                                                                                                                    |
| 2   | Should LEAD members receive a booking confirmation notification?                                | **Yes** — anyone who books an event expects a confirmation regardless of status.                                                                                                                                                                                                                                                                                                                 |
| 3   | Should the `MemberStatusHistory` audit table be built in v1 or v2?                              | **v1** — a strong, performant audit trail is required. It builds trust and is the primary tool for troubleshooting lifecycle issues.                                                                                                                                                                                                                                                             |
| 4   | Is `isTrial` a flag on `Event`, on `Product`, or on `EventType`?                                | **Flag on `Event`** — teacher checks a box when scheduling a session. The LEAD → TRIAL transition fires only for attendees who are currently `LEAD`; members at any other status attend normally with no status change. Experienced members are welcome to join trial events to demonstrate floor dynamics. `EventType` would only help if many recurring trial templates exist — not a v1 need. |
| 5   | Can a teacher manually upgrade a LEAD to ACTIVE without a purchase (e.g. cash payment offline)? | **Yes** — via a manual `EntitlementGrant`, which triggers the status transition automatically. Teachers can also manually set status to `TRIAL` or `ACTIVE` in exceptional cases (e.g. migrating legacy students).                                                                                                                                                                               |
