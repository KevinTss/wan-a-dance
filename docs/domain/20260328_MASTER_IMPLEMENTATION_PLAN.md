# Master Implementation Plan — Dance App API

**Date:** 2026-03-28
**Status:** Active

## Systems in scope

| System                      | Plan doc                                       |
| --------------------------- | ---------------------------------------------- |
| Member Identity & Lifecycle | `20260328_MEMBER_IDENTITY_LIFECYCLE_PLAN.md`   |
| Credits & Entitlements      | `20260327_CREDITS_ENTITLEMENTS_SYSTEM_PLAN.md` |
| WhatsApp Integration        | `20260326_WHATSAPP_INTEGRATION_PLAN.md`        |

---

## Dependency graph

```
Member Identity Lifecycle (Phase 1)
         │
         ├──► Credits & Entitlements (Phase 2-3)
         │         │
         │         └──► canMemberBook engine (Phase 4)
         │                       │
         │                       └──► Cancellation + restoration (Phase 5)
         │                       └──► Manual grants (Phase 6)
         │                       └──► Expiry job + LAPSED (Phase 7)
         │
         └──► WhatsApp (Phase 8) — largely independent, gated by member status
```

Member Identity is the hard dependency — nothing else builds correctly without correct status semantics.

---

## Build principles

- **E2E tests first.** Write failing tests that define the contract before writing a single line of service code.
- **Schema first within each phase.** Prisma migration must pass before any service code is written.
- **No partial implementations.** A phase is done when its tests pass, not when the code compiles.
- **One DB transaction per state change.** Balance updates, ledger rows, status transitions — all atomic.

---

## Phase 1 — Member Identity Lifecycle

**Goal:** establish the Member status state machine. Everything else depends on this.

### Schema changes

```prisma
// Expand MemberStatus enum
enum MemberStatus {
  LEAD
  TRIAL
  ACTIVE
  LAPSED
  DEACTIVATED
}

enum AcquisitionSource {
  PUBLIC_EVENT
  TRIAL_CLASS
  MANUAL
  INVITATION
}

// Add to Member model:
status              MemberStatus  @default(LEAD)
statusUpdatedAt     DateTime      @default(now()) @db.Timestamptz(3)
acquisitionSource   AcquisitionSource @default(MANUAL)
acquisitionEventId  String?

// New model
model MemberStatusHistory {
  id          String       @id @default(uuid())
  memberId    String
  member      Member       @relation(fields: [memberId], references: [id])
  fromStatus  MemberStatus?
  toStatus    MemberStatus
  reason      String?
  triggeredBy String?      // userId or "system"
  createdAt   DateTime     @default(now()) @db.Timestamptz(3)
  @@index([memberId])
  @@map("member_status_history")
}

// Add to WorkspaceConfig:
autoCreateLeads Boolean @default(true)

// Add to Event:
isTrial Boolean @default(false)
```

**Backfill migration:** set all existing members to `ACTIVE` (they were manually enrolled).

### E2E test coverage required

| Scenario                                     | Expected                                          |
| -------------------------------------------- | ------------------------------------------------- |
| Teacher manually adds member                 | status = LEAD, history row written                |
| LEAD member hits workspace endpoint          | 403 Forbidden                                     |
| DEACTIVATED member hits any endpoint         | 403 Forbidden                                     |
| ACTIVE member hits workspace endpoint        | 200 OK                                            |
| External user registers for PUBLIC event     | LEAD member auto-created, Attendee created        |
| Same user registers again for same workspace | no duplicate Member                               |
| LEAD attends trial event                     | status → TRIAL, history row                       |
| Teacher deactivates member                   | status → DEACTIVATED, history row                 |
| Teacher reactivates member                   | status → ACTIVE (or previous status), history row |
| Member list filtered by status=LEAD          | returns only LEADs                                |
| GET status history for member                | ordered list of transitions                       |
| Walk-in created with no userId               | member.userId = null                              |
| Walk-in linked to user account               | userId linked, past attendance preserved          |

### Services to implement / modify

- `MemberService.transitionStatus(memberId, toStatus, reason, triggeredBy)` — atomic update + history row
- `MemberService.findOrCreateLead(userId, workspaceId, eventId)` — idempotent
- `WorkspaceService.canAccessWorkspace()` — add `status: { notIn: [LEAD, DEACTIVATED] }` filter
- `MemberController` — add `status` filter to list endpoint, add `GET /:memberId/status-history`

---

## Phase 2 — Credits & Entitlements Schema

**Goal:** get all new tables in place before writing any service logic.

### Schema additions

```
Product, Price
WorkspaceCancellationPolicy, EventCancellationPolicyOverride
Purchase (+ enums PurchaseStatus)
EntitlementGrant (+ enums EntitlementKind, EntitlementSource, EntitlementStatus)
EntitlementTransaction (+ enum EntitlementTransactionType)
```

```prisma
// Extend Attendee:
consumedEntitlementId  String?
consumedEntitlement    EntitlementGrant? @relation(...)
cancelledAt            DateTime?         @db.Timestamptz(3)
cancelledById          String?
restorationStatus      RestorationStatus @default(NONE)

enum RestorationStatus { NONE PENDING RESTORED DENIED }
```

---

## Phase 3 — Product Catalog + Purchase Flow

### E2E test coverage required

| Scenario                                | Expected                                                       |
| --------------------------------------- | -------------------------------------------------------------- |
| Create product (credit pack)            | 201, product in DB                                             |
| Create price for product                | 201, price in DB                                               |
| Deactivate product                      | isActive = false, hidden from public listing                   |
| Create purchase for member              | status = PENDING                                               |
| Confirm purchase (teacher marks paid)   | status = PAID, EntitlementGrant ACTIVE created                 |
| Void pending purchase                   | status = CANCELLED, no EntitlementGrant                        |
| Refund paid purchase (fully unconsumed) | status = REFUNDED, grant REVOKED, balance 0, EXPIRY tx written |
| Refund partially consumed purchase      | remaining balance revoked, consumed portion preserved          |
| Confirm purchase for LEAD/TRIAL member  | member status → ACTIVE                                         |

### Services to implement

- `ProductService` — CRUD + isActive toggle
- `PurchaseService` — create, confirm (with EntitlementGrant creation + status transition), void, refund

---

## Phase 4 — canMemberBook Engine + Booking

### E2E test coverage required

| Scenario                                               | Expected                                  |
| ------------------------------------------------------ | ----------------------------------------- |
| DEACTIVATED member tries to book                       | 403 member-deactivated                    |
| Event is full                                          | 403 event-full                            |
| Event already started                                  | 403 event-already-started                 |
| LEAD member books event (no entitlement)               | Attendee created, no entitlement consumed |
| ACTIVE member books with CREDIT_BALANCE                | 1 credit debited, DEBIT tx written        |
| ACTIVE member has restricted pack (wrong dance type)   | falls through to unrestricted pack        |
| Member has two packs — soonest-expiring consumed first | correct pack selected                     |
| Cohort pass used for cohort event                      | grant CONSUMED, no credit debit           |
| Drop-in pass used for specific event                   | grant CONSUMED                            |
| Trial pass consumed                                    | grant CONSUMED, trial log written         |
| Member tries second trial in same workspace            | 403 trial-already-used                    |
| LEAD attends trial event                               | status → TRIAL                            |
| First purchase confirmed → member status → ACTIVE      | correct transition                        |
| Weekly usage limit reached                             | 403 weekly-limit-exceeded                 |

### Services to implement

- `EntitlementService.canMemberBook(memberId, eventId)` — full algorithm from the plan
- `AttendeeService.createWithEntitlement()` — wraps canMemberBook + atomic Attendee creation

---

## Phase 5 — Cancellation + Credit Restoration

### E2E test coverage required

| Scenario                                         | Expected                             |
| ------------------------------------------------ | ------------------------------------ |
| Cancel booking within full-restore window        | credit restored, REVERSAL tx written |
| Cancel booking within no-restore window          | no credit restored                   |
| Cancel booking in partial window                 | partial credit restored              |
| Event has cancellation override (non-refundable) | override takes precedence            |
| Workspace has no policy configured               | no restore on any cancellation       |
| Cancel cohort/drop-in pass booking               | grant returns to ACTIVE              |

### Services to implement

- `CancellationPolicyService.resolvePolicy(eventId, workspaceId)` — event override → workspace default
- `AttendeeService.cancel(attendeeId, cancelledById)` — policy resolution + conditional reversal

---

## Phase 6 — Manual Grants

### E2E test coverage required

| Scenario                               | Expected                                   |
| -------------------------------------- | ------------------------------------------ |
| Teacher grants free credits            | EntitlementGrant ACTIVE, CREDIT tx written |
| Teacher grants drop-in pass            | EntitlementGrant DROP_IN_PASS ACTIVE       |
| Teacher revokes unused grant           | grant REVOKED, remaining balance zeroed    |
| Teacher lists manual grants for member | correct list                               |

### Services to implement

- `EntitlementService.grantManual(...)` — create grant + write CREDIT transaction
- `EntitlementService.revoke(grantId)` — revoke + write EXPIRY transaction

---

## Phase 7 — Expiry Job + ACTIVE → LAPSED

### E2E test coverage required

| Scenario                                      | Expected                                               |
| --------------------------------------------- | ------------------------------------------------------ |
| Grant validUntil < now                        | grant EXPIRED, EXPIRY tx written, creditsRemaining = 0 |
| ACTIVE member with all grants expired         | member → LAPSED, history row                           |
| ACTIVE member with one remaining grant        | member stays ACTIVE                                    |
| Already LAPSED member not double-transitioned | idempotent                                             |

### Services to implement

- `EntitlementExpiryJob` — `@Cron` daily, expires grants + transitions ACTIVE → LAPSED

---

## Phase 8 — WhatsApp

**Note:** WhatsApp is largely independent of Phases 2-7. It only requires Phase 1 (member status) for notification gating.

### Schema additions

_(documented in the WhatsApp plan — Conversation, Message, WhatsAppUsageRecord, Member fields)_

### E2E test coverage required

| Scenario                                       | Expected                                     |
| ---------------------------------------------- | -------------------------------------------- |
| GET /webhooks/whatsapp (Meta handshake)        | returns challenge token                      |
| POST /webhooks/whatsapp with valid signature   | 200 processed                                |
| POST /webhooks/whatsapp with invalid signature | 401                                          |
| Inbound STOP message                           | member whatsappOptedOutAt set                |
| Outbound template send to opted-in member      | message record created, UsageRecord upserted |
| Outbound send to opted-out member              | 422 not sent                                 |
| Outbound send to member below min status       | 422 not sent                                 |
| Admin GET /admin/whatsapp/usage                | correct aggregation per workspace            |

### Services to implement

- `WhatsAppWebhookController` — GET (verification) + POST (inbound)
- `WhatsAppMessageService` — sendTemplate, processInbound, updateDeliveryStatus
- `WhatsAppUsageService` — upsertRecord, getAdminUsage
- `WhatsAppNotificationService` — respects opt-in + status gating

---

## Current status

| Phase                  | Tests | Implementation | Done |
| ---------------------- | ----- | -------------- | ---- |
| 1 — Member lifecycle   | ⬜    | ⬜             | ⬜   |
| 2 — Credits schema     | ⬜    | ⬜             | ⬜   |
| 3 — Product + Purchase | ⬜    | ⬜             | ⬜   |
| 4 — canMemberBook      | ⬜    | ⬜             | ⬜   |
| 5 — Cancellation       | ⬜    | ⬜             | ⬜   |
| 6 — Manual grants      | ⬜    | ⬜             | ⬜   |
| 7 — Expiry job         | ⬜    | ⬜             | ⬜   |
| 8 — WhatsApp           | ⬜    | ⬜             | ⬜   |

### Questions

1. there are whatsapp data in the Member model, but I did design the architecture with an Account model attached to the user, I feel that the user should have a Account type whatsapp instead with those into
   // WhatsApp opt-in
   whatsappPhone String?
   whatsappOptedInAt DateTime? @db.Timestamptz(3)
   whatsappOptedOutAt DateTime? @db.Timestamptz(3)

2. I think WorkspaceCancellationPolicy is useless, we have a workspace config concept, why is not there instead?
