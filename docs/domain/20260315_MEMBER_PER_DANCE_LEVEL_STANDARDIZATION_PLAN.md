# Member Per-Dance Level Standardization Plan

## 1. Problem Statement

Today, `Member` has a single `level` value (`members.level`).
This is insufficient because:

- A member can be beginner in one dance and advanced in another.
- Schools may use different labels for levels (for example: Starter/Beginner/Advanced vs L1/L2/L3).

Goal: support **per-dance levels per member** while keeping a **global standardized level model** across all schools.

## 2. Product Goals

1. Teachers can set a member level for a specific dance type.
2. A member can hold multiple dance-level entries (one per dance type).
3. Level meaning is standardized across schools for portability and analytics.
4. Schools can keep custom display labels without changing standardized semantics.

## 3. Non-Goals (Phase 1)

- Auto-assessing levels from attendance history.
- Rewriting all existing workflows to require dance-level assignment.
- Removing the current `members.level` in first rollout (this should be a gradual deprecation).

## 4. Standardization Strategy

Use a canonical global level enum as the source of truth, shared by all schools.

Recommended canonical enum (example):

- `STARTER`
- `BEGINNER`
- `INTERMEDIATE`
- `ADVANCED`
- `EXPERT`

Important:

- Canonical levels must be stable and versioned only when truly necessary.
- Analytics, matching, search, and cross-school transfer use canonical levels.
- Schools can configure local labels for UI display, but not custom semantics.

## 5. Data Model Proposal

### 5.1 New Model: MemberDanceLevel

Create a join model between member and dance type enum:

- `id`
- `memberId`
- `danceType` (`DanceType` enum)
- `level` (canonical level enum)
- `assignedById` (teacher/owner who last set it)
- `assignedAt`
- `note` (optional teacher note)
- `createdAt`, `updatedAt`

Constraints:

- Unique `(memberId, danceType)`
- Index `(danceType, level)` for filtering
- Index `(memberId)` for profile reads

### 5.2 Workspace Level Label Mapping (Optional but recommended)

Add workspace configuration mapping for display labels:

- `workspaceId`
- `level` (canonical enum)
- `displayName` (string, unique per workspace)
- optional: `description`

This keeps core semantics global while allowing schools to show custom wording.

### 5.3 Existing `members.level`

- Keep during transition as legacy/general level.
- Mark as deprecated in API docs.
- Later remove after migration and client adoption.

## 6. API Plan

### 6.1 New Endpoints (member module)

1. `PUT /workspaces/:slug/members/:memberId/dance-levels/:danceType`

- Set or update a member level for one dance.
- Body: `{ level, note? }`
- Roles: `OWNER`, `TEACHER`

2. `DELETE /workspaces/:slug/members/:memberId/dance-levels/:danceType`

- Remove assignment for one dance.
- Roles: `OWNER`, `TEACHER`

3. `GET /workspaces/:slug/members/:memberId/dance-levels`

- Return all dance-level assignments for member.
- Roles: same read rules as member profile.

4. Extend member list/search filters:

- `danceType`
- `minLevel` / `maxLevel` (canonical)

### 6.2 DTO Changes

- Add `SetMemberDanceLevelDto` and response DTOs for assignment list.
- Keep existing member DTO backward compatible by adding optional `danceLevels` field.

## 7. Authorization Rules

- Only `OWNER` and `TEACHER` can assign/unassign levels.
- Students can only read their own assignments (or based on existing workspace visibility rules).
- `assignedById` is derived from auth user, never from client input.

## 8. Migration Plan

### Phase A: Introduce

- Add new tables/models and APIs.
- Keep `members.level` active.

### Phase B: Backfill

- For each member with legacy `members.level`, create `MemberDanceLevel` records:
  - Option 1: for configured workspace dance types.
  - Option 2: skip automatic fill and keep legacy only (safer but less complete).
- Prefer Option 1 only if workspace dance types are reliably configured.

### Phase C: Dual Read/Write

- On member read: return both legacy `level` and new `danceLevels`.
- On write: teacher-facing flows use `MemberDanceLevel`; legacy optional.

### Phase D: Deprecate Legacy

- Stop writing `members.level`.
- Remove legacy filters using `members.level`.
- Later DB migration to drop `members.level`.

## 9. Testing Plan

### 9.1 E2E (required)

- Assign level per dance type.
- Update existing assignment.
- Remove assignment.
- Authorization checks (`OWNER/TEACHER` allowed, others denied).
- Member list filtering by `danceType + level`.
- Cross-workspace isolation.

### 9.2 Unit (recommended)

- Service rules for upsert/delete.
- Canonical-level validation.
- Workspace label mapping resolution.

### 9.3 Migration Tests

- Verify legacy data remains intact.
- Verify backfill behavior for members with/without legacy level.

## 10. Analytics and Interoperability

All reports and cross-school logic should use canonical levels (`level` enum), not local display names.
This ensures comparability across schools while preserving local UX flexibility.

## 11. Rollout Sequence

1. Add schema + APIs + e2e tests.
2. Expose in teacher UI (set/read per dance type).
3. Add optional workspace label customization.
4. Deprecate legacy `members.level` after adoption.

## 12. Open Decisions

1. Canonical enum final naming (`INTERMEDIATE` vs current `INTERMEDIARY`).
2. Backfill strategy (automatic vs manual only).
3. Whether to keep a computed general level on member profile (for quick display).
4. Whether level history/audit trail is required now or in a later phase.
