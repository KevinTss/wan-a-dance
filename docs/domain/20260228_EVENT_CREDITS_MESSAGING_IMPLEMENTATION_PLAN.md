# Dance App Implementation Plan: Events, Credits, Messaging

## Purpose

Turn the backlog into an execution plan with clear phase gates, deliverables, and testing expectations.

## Scope

- Epic 1: Event Management Core
- Epic 2: Registration & Capacity
- Epic 3: Attendance
- Epic 4: Credits (Class Packs)
- Epic 5: Member Skills & Levels
- Epic 6: Messaging & Invitations (WhatsApp-first)
- Epic 7: Asset Library

## Execution Principles

- Build in dependency order: Event -> Registration -> Attendance -> Credits.
- Keep each epic releasable behind feature flags where needed.
- Every story must ship with API docs, tests, and module README updates.
- Prefer incremental migrations over large schema rewrites.

## Current Status Snapshot (As of 2026-02-28)

### Already In Place

- Auth foundation exists and is production-oriented (`src/auth`).
- Workspace lifecycle exists (create/read/update/delete/config) with guards (`src/workspace`).
- Member management exists in workspace context (`src/member`).
- Basic event endpoints exist (`create`, `list`) in `src/event`.
- Invitation flows exist (workspace invite, accept/decline) in `src/invitation`.
- Notification APIs exist (list/read/update/read-state) in `src/notification`.
- Material library baseline exists (CRUD + share + viewed) in `src/material`.
- Health endpoint exists (`GET /ping`).
- Module README coverage now exists for all current modules.

### Testing Baseline (Current)

- E2E present: `auth`, `invitation`, `member`, `user`, `workspace`.
- Unit present: `user`, `workspace`.
- Unit statement coverage snapshot by module:
  - `user`: `42.05%`
  - `workspace`: `14.78%`
  - `auth`, `event`, `invitation`, `mail`, `material`, `member`, `notification`: `0.00%`

### Still To Be Done (By Epic)

- Epic 1: recurring schedule model via `Event.parentId`, occurrence overrides, future-only split edits, cancellation policy enforcement.
- Epic 2: canonical participant model + transactional seat inventory + self-registration policy.
- Epic 3: full attendance domain and bulk/idempotent operations.
- Epic 4: complete credit domain (grants, immutable ledger, balance rules, consumption on check-in).
- Epic 5: dance catalog + per-dance level scales + member dance-level assignment.
- Epic 6: provider abstraction, WhatsApp connection, broadcast pipeline, targeting filters, automation.
- Epic 7: full asset library expansion (upload, visibility sharing, public discovery, skill catalog integration).

### Needs Update / Change in Existing Code

- `src/event`:
  - Add `Event.parentId` strategy instead of introducing separate `EventSeries`/`EventOccurrence` tables.
  - Parent event = recurring template; child event = concrete occurrence/override.
  - Add edit-one/edit-future and cancellation behavior with preserved history.
- `src/member`:
  - Introduce participant identity mapping (member/user/guest) without breaking current member APIs.
  - Extend with per-dance level assignment and querying.
- `src/material`:
  - Evolve toward Epic 7 asset model (visibility scopes, sharing rules, skill tagging).
- `src/notification`:
  - Rework as delivery-state component for messaging automation triggers.
- `src/invitation`:
  - Align invitation behavior with future messaging and registration onboarding flows.
- New bounded contexts required:
  - `registration`, `attendance`, `credit`, `messaging` modules (new or clearly separated subdomains).
- Cross-cutting technical changes:
  - Add stronger transactional boundaries (capacity and credits).
  - Add domain events/outbox where retries/idempotency matter.
  - Raise module-level unit coverage before expanding feature surface.

## Phase Plan

## Phase 1: Events + Registration (MVP foundation)

### Stories

- 1.1 Create One-Time Event
- 1.2 Create Recurring Event Series
- 1.3 Edit Single Occurrence
- 1.4 Edit Series (Future Only)
- 1.5 Cancel Occurrence
- 2.1 Participant Model
- 2.2 Register Participant to Event
- 2.3 Cancel Registration
- 2.4 Self Registration Permissions

### Backend Deliverables

- Extend `event` module with parent-child events (`parentId`) for recurring lifecycle.
- Add participant + registration models and APIs.
- Add transactional capacity checks and uniqueness constraints.
- Emit domain events for `event.created`, `event.cancelled`, `registration.created`, `registration.cancelled`.

### Data Model Deliverables

- `Event` with:
  - `parentId` (`null` = standalone/parent schedule; non-null = occurrence/override)
  - recurrence rule on parent events
  - per-child override status/time/capacity
- `Participant`
- `Registration`
- Capacity and status fields with indexes.
- Suggested constraints/indexes:
  - `@@index([parentId])`
  - `@@unique([parentId, dateStart])` for occurrence identity
  - registration linked to child event rows for recurring schedules

### Test Gate

- E2E coverage for all event + registration flows.
- Unit coverage on registration service transaction logic.
- Minimum target before phase sign-off: `>=60%` statement coverage for touched event/registration services.

## Phase 2: Attendance

### Stories

- 3.1 Mark Attendance
- 3.2 Bulk Attendance Actions

### Backend Deliverables

- Add attendance APIs and service rules.
- Ensure idempotent check-in/check-out behavior.
- Store audit fields (`markedBy`, timestamps).

### Data Model Deliverables

- `Attendance` with unique `(occurrenceId, participantId)`.

### Test Gate

- E2E for single and bulk attendance.
- Unit tests for idempotency and conflict cases.
- Minimum target: `>=70%` statement coverage for attendance service.

## Phase 3: Credits

### Stories

- 4.1 Manual Credit Grant
- 4.2 Credit Ledger
- 4.3 Consume Credit on Check-In
- 4.4 Credit Refund/Adjustment

### Backend Deliverables

- New `credit` domain module.
- Immutable ledger write path.
- Atomic deduction flow triggered by attendance status change.
- Configurable “allow attendance without credits” policy.

### Data Model Deliverables

- `CreditGrant`
- `CreditLedgerEntry`
- Optional read model for balance snapshot (derived/cached).

### Test Gate

- Unit tests for ledger invariants and transaction safety.
- E2E for grant -> attend -> consume -> refund lifecycle.
- Minimum target: `>=75%` statement coverage for credit service.

## Phase 4: Skills/Levels + Messaging Manual Campaigns

### Stories

- 5.1 Configure Dance Catalog
- 5.2 Configure Level Scale per Dance
- 5.3 Assign Member Level per Dance
- 5.4 Use Level in Event Targeting (filtering only)
- 6.1 Messaging Channel Abstraction
- 6.2 WhatsApp Connection Setup
- 6.3 Recipient Targeting & Filters
- 6.4 Send Broadcast Message
- 6.5 1:1 Message
- 6.6 Group/Community Posting (provider-dependent)

### Backend Deliverables

- Extend workspace/member domains for dance and level configuration.
- Add provider-agnostic messaging service + WhatsApp provider adapter.
- Add campaign orchestration and delivery tracking.
- Add recipient filter resolver using member metadata.

### Data Model Deliverables

- `DanceCatalog`, `DanceLevel`, `MemberDanceLevel`
- `MessagingConnection`
- `MessageCampaign`, `MessageRecipient`, `MessageDeliveryAttempt`

### Test Gate

- Unit tests for filter resolution and provider abstraction.
- E2E for campaign creation and send pipeline (mock provider).
- Minimum target: `>=65%` statement coverage for new messaging services.

## Phase 5: Messaging Automation

### Stories

- 6.7 Automated Event Reminders

### Backend Deliverables

- Trigger engine for event lifecycle reminders.
- Scheduled jobs for pre-event and post-event automations.
- Workspace-level automation toggle/config.

### Data Model Deliverables

- `AutomationRule`
- `AutomationExecution` / outbox records.

### Test Gate

- E2E for trigger-to-delivery flow.
- Unit tests for scheduling, dedupe, and retry behavior.
- Minimum target: `>=70%` statement coverage for automation services.

## Phase 6: Asset Library

### Stories

- 7.1 Skill/Step Catalog
- 7.2 Create Asset (Link-Based)
- 7.3 Upload Asset (Hosted)
- 7.4 Visibility & Access Control
- 7.5 Browse/Search
- 7.6 Multi-skill Tagging
- 7.7 Public Library Discovery

### Backend Deliverables

- Extend `material` domain into full asset library capabilities.
- Add visibility policy enforcement and cross-workspace sharing.
- Add searchable tagging by dance/skill/level.

### Data Model Deliverables

- `Asset`
- `Skill`
- `AssetSkill` (many-to-many)
- `AssetSharePolicy` / visibility entities

### Test Gate

- E2E for upload/link/create/read/search/share permission rules.
- Unit tests for visibility authorization logic.
- Minimum target: `>=70%` statement coverage for asset services.

## Dependency Matrix

- Event Management -> Registration -> Attendance -> Credits.
- Skills/Levels -> Messaging filters and event targeting.
- Event/Registration/Attendance changes -> Messaging automation triggers.
- Asset Library uses Skills/Levels for filtering and metadata.

## Module Mapping (Current Repo)

- `src/event`: Epic 1 baseline + Epic 2/3 integrations.
- `src/member`: participant linking + level assignment integration.
- `src/notification`: internal event hooks and delivery state helpers.
- `src/invitation`: optional invitation flows for campaign targets.
- `src/material`: Epic 7 foundation.
- New modules expected: `src/registration`, `src/attendance`, `src/credit`, `src/messaging` (or equivalent expansion of existing modules).

## Non-Functional Requirements

- Transaction safety for seat and credit consumption.
- Idempotency for attendance and message sends.
- Auditability for credits, attendance edits, and admin adjustments.
- Observability: logs + failure reasons for messaging.
- Performance: pagination on all list endpoints, indexed filter fields.

## Definition of Done (Per Story)

- API endpoint + DTO validation implemented.
- Authorization rules enforced.
- Domain events emitted where relevant.
- Unit tests and/or e2e tests added.
- README updated in touched module with user stories + coverage status.
- Lint and tests passing.

## Immediate Next Sprint (Recommended)

1. Finalize `Event.parentId` schema and migration for recurring schedules.
2. Implement story 1.1 + 1.2 endpoints and tests.
3. Introduce Participant + Registration schema with capacity transaction.
4. Deliver first end-to-end happy path: create recurring event -> register participant -> list roster.
