# Credits & Entitlements System — Design Plan

**Date:** 2026-03-27
**Status:** Decisions resolved — ready for implementation planning

---

## 1. What the Design Gets Right

Before anything else: the core architecture is sound.

- **Payments ≠ access rights** — the separation of `Purchase` from `EntitlementGrant` is the single most important decision in this system. Do not compromise it.
- **Centralized validation** — `canMemberBook(member, event)` as a single function is the right pattern. Scattered permission checks are a maintenance disaster.
- **Priority-based consumption** — consuming the most constrained entitlement first is correct and protects students from burning general credits when a specific pass exists.
- **Manual grants as first-class citizens** — not fake zero-amount purchases. This is the right call.

---

## 2. Architecture Decisions

All major questions are resolved. This section documents each decision and its rationale.

---

### 2.1 Entitlement scope — Member, not User

`User` is a global entity. `Member` is workspace-scoped. "10 classes at Studio A" has nothing to do with Studio B.

**Decision:** all entitlement and purchase models are scoped to `memberId`. The Stripe customer ID (future) stays on `User` — one per global account, not per workspace.

---

### 2.2 `Booking` naming collision — extend `Attendee`

The existing schema has `Attendee` with `memberId`, `eventId`, `role`, `type`. This IS the booking model. A parallel `Booking` model would create two sources of truth.

**Decision:** extend `Attendee` with:

```prisma
consumedEntitlementId String?
cancelledAt           DateTime?         @db.Timestamptz(3)
cancelledById         String?
restorationStatus     RestorationStatus @default(NONE)
```

---

### 2.3 `PricingRules` as JSON — use columns

Storing constraints in a JSON blob makes querying impossible without `jsonb` path extraction.

**Decision:** split into typed columns + optional overflow JSON for rare extensibility:

```
creditsGranted        Int?
expiresAfterDays      Int?
expiresAt             DateTime?
usageLimitPerWeek     Int?
validForCohortId      String?
validForDanceTypes    DanceType[]
extraConstraints      Json?
```

---

### 2.4 Mutable balance + immutable ledger — both in v1

`creditsRemaining` alone is a bank account with no statement. If a member disputes their balance, you have no evidence.

**Decision:** keep `creditsRemaining` for fast reads AND write an `EntitlementTransaction` row for every change (debit/credit/reversal/expiry). Every balance-changing operation runs in a DB transaction: update balance + insert ledger row atomically. The ledger is the source of truth; `creditsRemaining` is a cache. This matches the decision made for `MemberStatusHistory` — audit trail builds trust and is the primary tool for support.

---

### 2.5 Cancellation policy — workspace-level default, event-level override

**Decision:** one `WorkspaceCancellationPolicy` per workspace (the school's default). Teachers can optionally override it per event via `EventCancellationPolicyOverride`. Resolution order: event override → workspace default → no restore.

The policy defines:

- `fullRestoreBeforeHours` — cancel at least N hours before → full credit restore
- `noRestoreWithinHours` — cancel within N hours → no restore
- Gap between the two → partial restore (50% default, full customisation deferred to v2)

---

### 2.6 Cohort — Event parent, no new model

A cohort (e.g. "Jan–Mar Bachata Intermediate") is a recurring series. The existing `Event.parentId` self-relation already models this.

**Decision:** a cohort = a recurring `Event` parent. `validForCohortId` on an entitlement references that parent `Event.id`. No new `Cohort` model needed.

---

### 2.7 Trial abuse — memberId check in v1

**Decision:** check by `memberId` for v1. Dance school teachers know their students personally — the social deterrent is sufficient. Email-keyed `TrialConsumptionLog` deferred to v2 if abuse becomes a real problem.

---

### 2.8 Consumption priority tie-break

Within the same entitlement type, sort by:

1. Most constrained scope first (event-specific > dance-type-specific > unrestricted)
2. Earliest `validUntil` (soonest-expiring first)
3. Oldest `createdAt` (oldest grant first)

---

### 2.9 Refund flow

When a purchase is refunded, entitlement handling depends on consumption state:

1. **Fully unconsumed** → revoke entirely
2. **Partially consumed** → revoke remaining balance only, preserve consumed history
3. **Fully consumed** → no credits to revoke, flag for manual review

`Purchase.refundedAt` is set by the teacher. System transitions `EntitlementGrant.status → REVOKED`, zeroes `creditsRemaining`, writes `EXPIRY` transaction for the remaining balance. **Never model a refund as a negative-amount purchase.**

---

### 2.10 Subscription billing — separate subsystem

Subscription requires a separate billing loop (renewal, dunning, pause, mid-period cancellation, proration). Not an extension of the credit model.

**Decision:** plan it as a separate epic, do not leave it as a `billingPeriod` field on `Price`.

---

### 2.11 Payment provider — manual in v1, providers in v2+

**Decision:** no real payment provider in v1. The teacher records a purchase, marks it as paid themselves (cash, bank transfer, etc.). The system creates the `EntitlementGrant` when the teacher confirms payment.

`Purchase.paymentMethod` stores a free-text label ("cash", "bank transfer", "Lydia"). The `paymentProvider` and `providerRef` fields are reserved for Stripe/PayPal integration in a future version. The data model already supports providers without changes — only the trigger (webhook vs manual) changes.

---

### 2.12 VAT / tax — not in v1

**Decision:** no `taxCode` fields for now. The schema is clean enough to add them later without a painful migration.

---

### 2.13 Promo codes — v2

**Decision:** no promo codes in v1. The PromoCode model design is documented in section 3 for reference but not implemented.

---

## 3. Integration with Member Identity Plan

The credits system touches the Member Identity lifecycle in four places. These must be implemented together.

### 3.1 Booking validation and member status

`canMemberBook` must respect member status:

| Status        | Can book public events  | Can consume entitlements      |
| ------------- | ----------------------- | ----------------------------- |
| `LEAD`        | Yes (pays ticket price) | No                            |
| `TRIAL`       | Yes                     | Yes                           |
| `ACTIVE`      | Yes                     | Yes                           |
| `LAPSED`      | Yes (pays ticket price) | No — all entitlements expired |
| `DEACTIVATED` | **No**                  | **No**                        |

The existing guard check "member is active" must be replaced with "member is not DEACTIVATED".

### 3.2 Public event pricing

Before creating a Purchase for a public event, determine the price from member status:

```
member.status is ACTIVE or TRIAL → apply event.memberPrice (if configured)
member.status is LEAD, LAPSED, or no member exists → apply event.publicPrice
```

This is evaluated at registration time and stored on `Purchase.amountPaid`.

### 3.3 LEAD → TRIAL on booking confirmation

When an `Attendee` is created for an event where `event.isTrial = true` and the member's current status is `LEAD`:

- Transition member status to `TRIAL`
- Write `MemberStatusHistory` row

Members already at `TRIAL`, `ACTIVE`, or `LAPSED` attend trial events normally with no status change — teachers may invite experienced dancers to demo.

### 3.4 ACTIVE → LAPSED in the entitlement expiry job

The daily job that expires `EntitlementGrant` records must also:

- After processing expiries, find all members with `status = ACTIVE` whose every `EntitlementGrant` is now `EXPIRED`, `CONSUMED`, or `REVOKED`
- Transition those members to `LAPSED`
- Write `MemberStatusHistory` rows

This runs as one coordinated job, not two separate cron entries.

---

## 4. Proposed Refined Data Model

```prisma
// ─── Product Catalog ──────────────────────────────────────────────

enum ProductType {
  CREDIT_PACK
  DROP_IN
  TRIAL
  COHORT_PASS
  BOOTCAMP_PASS
  PRIVATE_PACK
}

model Product {
  id          String      @id @default(uuid())
  createdAt   DateTime    @default(now()) @db.Timestamptz(3)
  updatedAt   DateTime    @updatedAt      @db.Timestamptz(3)
  deletedAt   DateTime?   @db.Timestamptz(3)

  workspaceId String
  workspace   Workspace   @relation(fields: [workspaceId], references: [id])

  name        String
  type        ProductType
  isActive    Boolean     @default(true)
  isPublic    Boolean     @default(true)  // visible on booking page

  prices      Price[]

  @@index([workspaceId, type])
  @@map("products")
}

model Price {
  id          String   @id @default(uuid())
  createdAt   DateTime @default(now()) @db.Timestamptz(3)
  updatedAt   DateTime @updatedAt      @db.Timestamptz(3)

  productId   String
  product     Product  @relation(fields: [productId], references: [id])

  label       String?           // e.g. "10-class pack", "January cohort"
  amount      Decimal           @db.Decimal(10, 2)
  currency    String            @default("EUR")

  // What this price grants when purchased
  creditsGranted        Int?
  expiresAfterDays      Int?
  expiresAt             DateTime?   @db.Timestamptz(3)
  usageLimitPerWeek     Int?
  validForCohortId      String?     // Event.id where isRecurringParent = true
  validForDanceTypes    DanceType[] // empty = all dance types
  firstClassFree        Boolean     @default(false)
  isTransferable        Boolean     @default(false)

  extraConstraints      Json?       // extensibility overflow

  purchases   Purchase[]

  @@index([productId])
  @@map("prices")
}

// ─── Cancellation Policies ────────────────────────────────────────

// Workspace-level default
model WorkspaceCancellationPolicy {
  id          String    @id @default(uuid())
  workspaceId String    @unique
  workspace   Workspace @relation(fields: [workspaceId], references: [id])

  // Hours before event start:
  fullRestoreBeforeHours Int?   // cancel >= N hours → full restore
  noRestoreWithinHours   Int?   // cancel < N hours → no restore
  // Gap between the two = partial restore (50% in v1)

  updatedAt   DateTime  @updatedAt @db.Timestamptz(3)

  @@map("workspace_cancellation_policies")
}

// Optional event-level override
model EventCancellationPolicyOverride {
  id          String   @id @default(uuid())
  eventId     String   @unique
  event       Event    @relation(fields: [eventId], references: [id])

  fullRestoreBeforeHours Int?
  noRestoreWithinHours   Int?

  @@map("event_cancellation_policy_overrides")
}

// ─── Purchase ─────────────────────────────────────────────────────

enum PurchaseStatus {
  PENDING    // created, awaiting teacher confirmation
  PAID       // teacher confirmed payment
  CANCELLED  // abandoned or voided before confirmation
  REFUNDED   // teacher marked as refunded
  // FAILED is reserved for future payment provider integrations
}

model Purchase {
  id          String         @id @default(uuid())
  createdAt   DateTime       @default(now()) @db.Timestamptz(3)
  updatedAt   DateTime       @updatedAt      @db.Timestamptz(3)

  memberId    String
  member      Member         @relation(fields: [memberId], references: [id])

  priceId     String
  price       Price          @relation(fields: [priceId], references: [id])

  status      PurchaseStatus @default(PENDING)
  amountPaid  Decimal        @db.Decimal(10, 2)
  currency    String         @default("EUR")

  // Manual payment tracking (v1)
  paymentMethod   String?   // free text: "cash", "bank transfer", "Lydia"
  paidAt          DateTime? @db.Timestamptz(3)
  confirmedById   String?   // userId of teacher who confirmed payment
  refundedAt      DateTime? @db.Timestamptz(3)
  refundedById    String?

  // Payment provider fields (reserved for v2+ Stripe/PayPal integration)
  paymentProvider String?   // "stripe" | "paypal" | null
  providerRef     String?   // Stripe PaymentIntent ID or equivalent

  entitlementGrant EntitlementGrant?

  @@index([memberId])
  @@map("purchases")
}

// ─── Entitlement ──────────────────────────────────────────────────

enum EntitlementKind {
  CREDIT_BALANCE  // N usable credits
  COHORT_ACCESS   // access to all sessions in a cohort
  DROP_IN_PASS    // single-use for one specific event (or any event)
  TRIAL_PASS      // first class free (one-time per workspace)
}

enum EntitlementSource {
  PURCHASE     // created on purchase confirmation
  ADMIN        // manually granted by teacher/owner
  PROMO        // created by promo code redemption (v2)
  COMPENSATION // issued after a cancelled class
  SYSTEM       // internal (e.g. referral bonus)
}

enum EntitlementStatus {
  ACTIVE
  CONSUMED   // fully used
  EXPIRED    // past validUntil
  REVOKED    // manually cancelled or refund-triggered
}

model EntitlementGrant {
  id          String            @id @default(uuid())
  createdAt   DateTime          @default(now()) @db.Timestamptz(3)
  updatedAt   DateTime          @updatedAt      @db.Timestamptz(3)

  workspaceId String
  workspace   Workspace         @relation(fields: [workspaceId], references: [id])

  memberId    String
  member      Member            @relation(fields: [memberId], references: [id])

  kind        EntitlementKind
  source      EntitlementSource
  status      EntitlementStatus @default(ACTIVE)

  // Credit balance fields (kind = CREDIT_BALANCE)
  creditsTotal     Int?
  creditsRemaining Int?  // cached balance — rebuilt from transactions if drift detected

  // Scope constraints
  validForCohortId   String?     // Event.id (recurring parent)
  validForEventId    String?     // single specific Event.id (drop-in pass)
  validForDanceTypes DanceType[] // empty = unrestricted
  usageLimitPerWeek  Int?

  // Validity window
  validFrom  DateTime? @db.Timestamptz(3)
  validUntil DateTime? @db.Timestamptz(3)

  // Audit
  note        String?
  grantedById String?  // userId of teacher for ADMIN/COMPENSATION grants
  grantedBy   User?    @relation(fields: [grantedById], references: [id])

  purchaseId  String?  @unique
  purchase    Purchase? @relation(fields: [purchaseId], references: [id])

  transactions EntitlementTransaction[]
  consumedBy   Attendee[]

  @@index([memberId, status])
  @@index([workspaceId, memberId])
  @@map("entitlement_grants")
}

model EntitlementTransaction {
  id                 String                    @id @default(uuid())
  createdAt          DateTime                  @default(now()) @db.Timestamptz(3)

  entitlementGrantId String
  entitlementGrant   EntitlementGrant          @relation(fields: [entitlementGrantId], references: [id])

  type               EntitlementTransactionType
  amount             Int      // always positive; direction determined by type
  balanceAfter       Int      // snapshot of creditsRemaining after this transaction

  attendeeId         String?  // Attendee that caused this debit/reversal
  note               String?
  createdById        String   // userId

  @@index([entitlementGrantId])
  @@map("entitlement_transactions")
}

enum EntitlementTransactionType {
  CREDIT     // added credits (initial grant, compensation, reversal)
  DEBIT      // consumed credits (booking)
  REVERSAL   // credits returned after cancellation
  EXPIRY     // system-expired remaining balance
}

// ─── Attendee extension (additions to existing model) ─────────────
// Add to the existing Attendee model:
//
//   consumedEntitlementId  String?
//   consumedEntitlement    EntitlementGrant? @relation(...)
//   cancelledAt            DateTime?         @db.Timestamptz(3)
//   cancelledById          String?
//   restorationStatus      RestorationStatus @default(NONE)
//
// enum RestorationStatus { NONE PENDING RESTORED DENIED }

// ─── PromoCode (v2 — model for reference, not implemented in v1) ──
// model PromoCode {
//   code              String   @unique
//   workspaceId       String
//   type              PromoCodeType  // PERCENTAGE | FIXED | FREE_ENTITLEMENT
//   value             Decimal?
//   entitlementTemplate Json?
//   maxRedemptions    Int?
//   redemptionCount   Int  @default(0)
//   validFrom         DateTime?
//   validUntil        DateTime?
//   onePerUser        Boolean @default(true)
// }
```

---

## 5. Booking Validation Algorithm

Single function — never inline this logic elsewhere.

```
canMemberBook(memberId, eventId) → { allowed: boolean, reason?: string, entitlementId?: string }
```

### Step 0 — determine price (public events only)

If `event.visibility = PUBLIC`:

- `member.status` is `ACTIVE` or `TRIAL` → apply `event.memberPrice` (if configured)
- Otherwise → apply `event.publicPrice`

Store resolved price on the resulting `Purchase` record.

### Step 1 — guard checks (fail fast)

1. Member exists in workspace → else `member-not-found`
2. Member status is not `DEACTIVATED` → else `member-deactivated`
3. Event exists, is not cancelled, belongs to same workspace → else `event-not-found`
4. `event.dateStart > now()` → else `event-already-started`
5. Seat available: `capacityMax == null || attendeeCount < capacityMax` → else `event-full`

### Step 2 — entitlement eligibility

If `member.status` is `LEAD` or `LAPSED`: skip entitlement check — member pays ticket price directly. Jump to step 4 with no entitlement.

Otherwise, query all `EntitlementGrant` where:

- `memberId = memberId`, `status = ACTIVE`
- `validFrom <= now() OR validFrom IS NULL`
- `validUntil >= now() OR validUntil IS NULL`
- `validForDanceTypes` contains `event.danceTypes[0]` OR is empty

Then filter each by additional constraints:

- `validForCohortId`: event must be a child of that cohort parent
- `validForEventId`: must match this exact event
- `usageLimitPerWeek`: count bookings in last 7 days from this grant — if >= limit, skip
- `kind = TRIAL_PASS`: check if member has already consumed a trial in this workspace — if yes, skip
- `kind = CREDIT_BALANCE`: `creditsRemaining > 0`

If no valid entitlement found → `no-valid-entitlement`

### Step 3 — select best entitlement

Priority order (highest first):

1. `DROP_IN_PASS` with `validForEventId = this event`
2. `COHORT_ACCESS` with `validForCohortId = event.parentId`
3. `CREDIT_BALANCE` with `validForDanceTypes` non-empty (constrained), sorted by `validUntil ASC NULLS LAST` then `createdAt ASC`
4. `TRIAL_PASS`
5. `CREDIT_BALANCE` unrestricted, sorted by `validUntil ASC NULLS LAST` then `createdAt ASC`

### Step 4 — consume (in a DB transaction)

1. Create `Attendee` record
2. If `kind = CREDIT_BALANCE`: decrement `creditsRemaining`, write `EntitlementTransaction (DEBIT, 1, balanceAfter)`
3. If `kind = DROP_IN_PASS` / `COHORT_ACCESS` / `TRIAL_PASS`: set `status = CONSUMED`
4. Link `Attendee.consumedEntitlementId`

### Step 5 — member status transitions

1. If `event.isTrial = true` AND `member.status = LEAD` → transition to `TRIAL`, write `MemberStatusHistory`
2. If `member.status = LEAD` or `LAPSED` AND this is a public event → no status change (still LEAD/LAPSED until they purchase)
3. After entitlement consumption, if `kind = TRIAL_PASS` → record in trial consumption log for this member × workspace

---

## 6. State Machines

### Purchase state machine

```
PENDING → PAID        (teacher confirms payment manually)
PENDING → CANCELLED   (teacher voids or student abandons)
PAID    → REFUNDED    (teacher marks as refunded)
```

On `PAID` → create `EntitlementGrant` (source: PURCHASE). Transition member to `ACTIVE` if status was `LEAD` or `TRIAL`.
On `REFUNDED` → set `EntitlementGrant.status = REVOKED`, zero `creditsRemaining`, write `EXPIRY` transaction.

> Note: `FAILED` is reserved for future payment provider integrations (Stripe, PayPal). Not used in v1.

### EntitlementGrant state machine

```
ACTIVE → CONSUMED   (all credits used, or single-use consumed)
ACTIVE → EXPIRED    (validUntil < now, via daily scheduled job)
ACTIVE → REVOKED    (teacher revokes, or purchase refunded)
```

States are terminal. The daily expiry job:

1. Finds all `ACTIVE` grants where `validUntil < NOW()`
2. Writes `EXPIRY` transaction for remaining balance
3. Sets `status = EXPIRED`, `creditsRemaining = 0`
4. Finds members with `status = ACTIVE` and zero remaining `ACTIVE` grants → transitions to `LAPSED`, writes `MemberStatusHistory`

---

## 7. User Stories

### 7.1 Student / Participant

**Viewing entitlements**

- As a student, I can see all my active credit packs, how many credits remain, and when they expire.
- As a student, I can see the full transaction history for each credit pack (which classes consumed which credits).
- As a student, I can see when a credit pack has expired or been fully consumed.

**Booking with credits**

- As an ACTIVE student, when I book a class the system automatically selects the most appropriate entitlement and consumes one credit.
- As an ACTIVE student, if I have multiple credit packs the system uses the most constrained and soonest-expiring one first.
- As an ACTIVE student, I can book a class included in my cohort pass without consuming general credits.
- As a TRIAL student, I can book a class using my credits if I have been granted them.

**Trial class**

- As an authenticated user, I can attend one trial class per workspace for free if the school offers it.
- As a student, I cannot claim a second free trial at the same school.

**Public event registration**

- As a LEAD (or any status), I can register for a public event and pay the ticket price directly without needing a credit pack.
- As an ACTIVE or TRIAL member, I get a discounted member price on public events when the school has configured one.

**Cancellation**

- As a student, if I cancel a booking within the school's cancellation policy window, I get my credit restored automatically.
- As a student, if I cancel outside the policy window, I do not get my credit back.
- As a student, I can see the cancellation deadline for any booking I have made.

**Refund**

- As a student, if a purchase is refunded my remaining credits are revoked and I can see the refund in my transaction history.

---

### 7.2 Teacher

**Product management**

- As a teacher, I can create a credit pack product (name, price, number of credits, expiry days, dance type restriction).
- As a teacher, I can create a drop-in product (single event access, no credits).
- As a teacher, I can create a trial product (first class free, one-time per member).
- As a teacher, I can create a cohort pass granting access to all sessions in a recurring series.
- As a teacher, I can deactivate a product so it no longer appears in the booking page.
- As a teacher, I can create multiple price variants for the same product (e.g. early bird vs full price).

**Manual purchase management (v1 — no payment provider)**

- As a teacher, I can record a purchase for a student (product + price + payment method: cash / bank transfer / etc.).
- As a teacher, I can mark a purchase as paid, which immediately creates the entitlement for the student.
- As a teacher, I can void a pending purchase that was never paid.
- As a teacher, I can mark a purchase as refunded, which revokes any remaining credits.
- As a teacher, I can see all pending (unconfirmed) purchases so I know who I'm waiting on.
- As a teacher, I can see the full purchase history for a student.

**Manual entitlement grants**

- As a teacher, I can grant free credits to any member with a note explaining why (e.g. compensation, promotion, trial extension).
- As a teacher, I can grant access to a specific single event for a member (DROP_IN_PASS).
- As a teacher, I can revoke an unused grant at any time.
- As a teacher, I can see all manual grants I have issued and their current status.

**Booking management**

- As a teacher, I can cancel a student's booking and see whether credits will be restored based on the policy.
- As a teacher, I can see which entitlement was consumed for each booking in the attendance list.
- As a teacher, I can see a student's current entitlement balance when managing their profile.

**Cancellation policy**

- As a teacher, I can configure the workspace-level cancellation policy (full restore window, no-restore window).
- As a teacher, I can override the cancellation policy for a specific event (e.g. a non-refundable showcase).
- As a teacher, I can set an event with no cancellation policy, meaning no credit is ever restored for cancellations.

---

### 7.3 School Admin / Owner

**Catalog and pricing**

- As a school admin, I can see all products, prices, and their current status (active / inactive).
- As a school admin, I can see total revenue per product over a time period.
- As a school admin, I can see which products are most frequently purchased.

**Entitlement visibility**

- As a school admin, I can see how many active credit packs are currently held across all members.
- As a school admin, I can see which members have credits expiring in the next 30 days (to run a reminder campaign).
- As a school admin, I can see the full financial and entitlement history for any member.

---

### 7.4 System

- As the system, I automatically create an `EntitlementGrant` when a teacher confirms a purchase as paid.
- As the system, I select the most appropriate entitlement for a booking using the priority rules, without any teacher intervention.
- As the system, I write an `EntitlementTransaction` ledger row for every credit change (debit, credit, reversal, expiry).
- As the system, I apply the cancellation policy (event override if set, then workspace default) to determine credit restoration when a booking is cancelled.
- As the system, I run a daily job that expires overdue entitlements and transitions ACTIVE members with zero remaining grants to LAPSED.
- As the system, I transition a member from LEAD or TRIAL to ACTIVE immediately when a purchase is confirmed.
- As the system, I transition a LEAD member to TRIAL when they attend an event with `isTrial = true`.
- As the system, I never allow a DEACTIVATED member to book any event.
- As the system, I apply `memberPrice` for ACTIVE/TRIAL members and `publicPrice` for LEAD/LAPSED members on public events.

---

## 8. Implementation Epics (Ordered)

| Epic | Scope                                                                 | v1  | Depends on                         |
| ---- | --------------------------------------------------------------------- | --- | ---------------------------------- |
| 1    | Product + Price catalog endpoints                                     | ✅  | —                                  |
| 2    | Manual purchase flow (teacher confirms payment)                       | ✅  | Epic 1                             |
| 3    | EntitlementGrant creation from confirmed purchase                     | ✅  | Epic 2                             |
| 4    | `canMemberBook` validation engine (incl. member status checks)        | ✅  | Epic 3, Member Identity Epic 1     |
| 5    | Extend Attendee with entitlement consumption + status transitions     | ✅  | Epic 4                             |
| 6    | Cancellation + credit restoration (workspace policy + event override) | ✅  | Epic 5                             |
| 7    | Manual grants (teacher admin endpoints)                               | ✅  | Epic 3                             |
| 8    | Entitlement expiry job + ACTIVE → LAPSED transition                   | ✅  | Epics 3, 5, Member Identity Epic 1 |
| 9    | Cohort pass (validForCohortId)                                        | ✅  | Epics 1–5                          |
| 10   | Stripe / payment provider webhook integration                         | v2  | Epics 1–3                          |
| 11   | Promo codes                                                           | v2  | Epic 3                             |
| 12   | Subscription billing loop                                             | v3  | Epics 1–6                          |
