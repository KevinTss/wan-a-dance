# Frontend API Spec — New Endpoints (Unreleased)

**Date:** 2026-04-11
**Scope:** All new and changed API surface from the member lifecycle, credits & entitlements, and WhatsApp integration work.

---

## Conventions

All responses are wrapped in a standard envelope:

```json
{
  "data": { ... },
  "error": null,
  "meta": { ... }   // only present on paginated responses
}
```

All endpoints except the WhatsApp webhook require a `Bearer` JWT in the `Authorization` header.

`{slug}` is the workspace slug (e.g. `studio-a`).

---

## 1. Member Lifecycle

### 1.1 Member list — new `status` filter

`GET /workspaces/{slug}/members`
**Auth:** OWNER or TEACHER
**Roles:** unchanged

**New query parameter:**

| Param    | Type                      | Description                     |
| -------- | ------------------------- | ------------------------------- |
| `status` | `MemberStatus` (optional) | Filter to a single status value |

`MemberStatus` enum: `LEAD | TRIAL | ACTIVE | LAPSED | DEACTIVATED`

Example: `GET /workspaces/studio-a/members?status=LEAD`

**Response — MemberResponseDto now includes `status`:**

```json
{
  "data": [
    {
      "id": "mem_xxx",
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "+33612345678",
      "roles": ["STUDENT"],
      "status": "LEAD",
      "level": null,
      "levelName": null,
      "preferredDanceRole": null,
      "workspaceId": "ws_xxx",
      "user": null
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20 },
  "error": null
}
```

> **Note on `status` semantics:**
>
> - `LEAD` — added manually or attended a public event. No ongoing relationship, no access to private workspace content.
> - `TRIAL` — attended at least one trial class.
> - `ACTIVE` — has at least one active entitlement (credit pack, pass, etc.).
> - `LAPSED` — was ACTIVE, all entitlements expired.
> - `DEACTIVATED` — manually blocked. Cannot attend or register.

---

### 1.2 Transition a member's status

`PATCH /workspaces/{slug}/members/{memberId}/status`
**Auth:** OWNER or TEACHER

**Request body:**

```json
{
  "status": "ACTIVE",
  "reason": "First payment received"
}
```

| Field    | Type           | Required | Notes                                 |
| -------- | -------------- | -------- | ------------------------------------- |
| `status` | `MemberStatus` | ✅       | Target status                         |
| `reason` | `string`       | ❌       | Human-readable note stored in history |

**Response `200`:**

```json
{
  "data": {
    "id": "mem_xxx",
    "status": "ACTIVE"
  },
  "error": null
}
```

**Allowed transitions from the UI:**
Only OWNER/TEACHER can call this endpoint. Students cannot change their own status.
The system automatically handles `LEAD → TRIAL` (trial class attendance) and `* → ACTIVE` (purchase confirmation). The teacher should only need to use this for `DEACTIVATED` and manual overrides.

---

### 1.3 Get a member's status history

`GET /workspaces/{slug}/members/{memberId}/status-history`
**Auth:** OWNER or TEACHER

**Response `200`:**

```json
{
  "data": [
    {
      "id": "mem_xxx",
      "memberId": "mem_yyy",
      "fromStatus": null,
      "toStatus": "LEAD",
      "reason": null,
      "triggeredBy": "usr_xxx",
      "createdAt": "2026-03-29T15:00:00.000Z"
    },
    {
      "id": "mem_zzz",
      "memberId": "mem_yyy",
      "fromStatus": "LEAD",
      "toStatus": "ACTIVE",
      "reason": "First payment received",
      "triggeredBy": "usr_xxx",
      "createdAt": "2026-04-01T10:00:00.000Z"
    }
  ],
  "error": null
}
```

Ordered chronologically ascending. `fromStatus` is `null` for the initial creation row. `triggeredBy` is a `userId` or `"system"`.

---

## 2. Products & Prices

### 2.1 Create a product (credit pack / pass)

`POST /workspaces/{slug}/products`
**Auth:** OWNER or TEACHER

**Request body:**

```json
{
  "name": "10-Class Pack",
  "description": "Valid for 90 days",
  "kind": "CREDIT_BALANCE",
  "credits": 10,
  "validityDays": 90,
  "restrictedDanceTypes": ["SALSA"],
  "maxUsagePerWeek": 2
}
```

| Field                  | Type              | Required | Notes                         |
| ---------------------- | ----------------- | -------- | ----------------------------- |
| `name`                 | `string`          | ✅       |                               |
| `description`          | `string`          | ❌       |                               |
| `kind`                 | `EntitlementKind` | ✅       | See enum below                |
| `credits`              | `integer ≥ 1`     | ❌       | Required for `CREDIT_BALANCE` |
| `validityDays`         | `integer ≥ 1`     | ❌       | Days from purchase date       |
| `restrictedDanceTypes` | `DanceType[]`     | ❌       | Empty = unrestricted          |
| `maxUsagePerWeek`      | `integer ≥ 1`     | ❌       | Weekly usage cap              |

`EntitlementKind` enum: `CREDIT_BALANCE | DROP_IN_PASS | COHORT_PASS | TRIAL_PASS`

**Response `201`:**

```json
{
  "data": {
    "id": "prod_xxx",
    "workspaceId": "ws_xxx",
    "name": "10-Class Pack",
    "description": "Valid for 90 days",
    "kind": "CREDIT_BALANCE",
    "isActive": true,
    "credits": 10,
    "validityDays": 90,
    "restrictedDanceTypes": ["SALSA"],
    "maxUsagePerWeek": 2,
    "createdAt": "2026-04-01T10:00:00.000Z",
    "updatedAt": "2026-04-01T10:00:00.000Z"
  },
  "error": null
}
```

---

### 2.2 List products

`GET /workspaces/{slug}/products`
**Auth:** OWNER or TEACHER

**Response `200`:** Array of products, each including their active prices:

```json
{
  "data": [
    {
      "id": "prod_xxx",
      "name": "10-Class Pack",
      "kind": "CREDIT_BALANCE",
      "isActive": true,
      "credits": 10,
      "validityDays": 90,
      "restrictedDanceTypes": [],
      "maxUsagePerWeek": null,
      "prices": [
        {
          "id": "price_xxx",
          "amountCents": 12000,
          "currency": "EUR",
          "label": "Standard",
          "isActive": true
        }
      ]
    }
  ],
  "error": null
}
```

Ordered by `createdAt` descending. Only active prices are included.

---

### 2.3 Update a product

`PATCH /workspaces/{slug}/products/{productId}`
**Auth:** OWNER or TEACHER

**Request body (all fields optional):**

```json
{
  "name": "10-Class Pack (updated)",
  "description": "New description",
  "isActive": false
}
```

Use `isActive: false` to deactivate (hide from public listing). Deactivated products are not deleted — existing entitlements are unaffected.

**Response `200`:** Updated product object.

---

### 2.4 Add a price to a product

`POST /workspaces/{slug}/products/{productId}/prices`
**Auth:** OWNER or TEACHER

**Request body:**

```json
{
  "amountCents": 12000,
  "currency": "EUR",
  "label": "Early bird"
}
```

| Field         | Type          | Required | Notes                         |
| ------------- | ------------- | -------- | ----------------------------- |
| `amountCents` | `integer ≥ 0` | ✅       | Price in cents                |
| `currency`    | `string`      | ❌       | Defaults to `"EUR"`           |
| `label`       | `string`      | ❌       | e.g. "Early bird", "Standard" |

**Response `201`:** Created price object.

---

## 3. Purchases

### 3.1 Create a purchase (PENDING)

`POST /workspaces/{slug}/purchases`
**Auth:** OWNER or TEACHER

A purchase starts in `PENDING` state. No entitlement is created yet. Used to record that a payment is expected.

**Request body:**

```json
{
  "memberId": "mem_xxx",
  "productId": "prod_xxx",
  "priceId": "price_xxx",
  "notes": "Paid in cash"
}
```

| Field       | Type     | Required | Notes                                   |
| ----------- | -------- | -------- | --------------------------------------- |
| `memberId`  | `string` | ✅       | Must belong to this workspace           |
| `productId` | `string` | ✅       | Must belong to this workspace           |
| `priceId`   | `string` | ❌       | If provided, must belong to the product |
| `notes`     | `string` | ❌       | Free text for the teacher               |

**Response `201`:**

```json
{
  "data": {
    "id": "pur_xxx",
    "workspaceId": "ws_xxx",
    "memberId": "mem_xxx",
    "productId": "prod_xxx",
    "priceId": "price_xxx",
    "status": "PENDING",
    "paidAt": null,
    "refundedAt": null,
    "notes": "Paid in cash",
    "createdById": "usr_xxx",
    "paidById": null,
    "createdAt": "2026-04-01T10:00:00.000Z",
    "updatedAt": "2026-04-01T10:00:00.000Z"
  },
  "error": null
}
```

---

### 3.2 Confirm a purchase (PENDING → PAID)

`PATCH /workspaces/{slug}/purchases/{purchaseId}/confirm`
**Auth:** OWNER or TEACHER

Marks the purchase as paid. **Side effects (all atomic):**

- Creates an `EntitlementGrant` with status `ACTIVE` for the member.
- If member status is `LEAD` or `TRIAL`, transitions them to `ACTIVE` (with history row).

**Response `200`:** Updated purchase object with `status: "PAID"`.

---

### 3.3 Cancel a purchase (PENDING → CANCELLED)

`PATCH /workspaces/{slug}/purchases/{purchaseId}/cancel`
**Auth:** OWNER or TEACHER

Only works on `PENDING` purchases. No entitlement was created so nothing else happens.

**Response `200`:** Updated purchase object with `status: "CANCELLED"`.

---

### 3.4 Refund a purchase (PAID → REFUNDED)

`PATCH /workspaces/{slug}/purchases/{purchaseId}/refund`
**Auth:** OWNER or TEACHER

Only works on `PAID` purchases. **Side effects:**

- The associated `EntitlementGrant` is set to `REVOKED`, `creditsRemaining = 0`.
- An `EXPIRY` transaction is written to the ledger.
- Previously consumed credits (used bookings) are **not** reversed.

**Response `200`:** Updated purchase object with `status: "REFUNDED"`.

---

## 4. Bookings (Attendees)

### 4.1 Book an event (creates Attendee)

`POST /workspaces/{slug}/events/{eventId}/attendees`
**Auth:** Any workspace member (OWNER / TEACHER / STUDENT)

The caller books themselves (resolved from their JWT). The system automatically finds the best available entitlement grant (soonest-expiring first) and debits 1 credit atomically.

**Request body:**

```json
{
  "role": "FOLLOWER"
}
```

| Field  | Type                               | Required | Notes |
| ------ | ---------------------------------- | -------- | ----- |
| `role` | `DanceRole` (`LEADER \| FOLLOWER`) | ❌       |       |

**Response `201`:** Created attendee object.

**Error codes:**

| HTTP | Code                   | Meaning                                              |
| ---- | ---------------------- | ---------------------------------------------------- |
| 402  | `insufficient-credits` | No active entitlement with remaining credits         |
| 409  | `already-booked`       | Member already has an attendee record for this event |
| 404  | `event-not-found`      | Event not in this workspace                          |

---

### 4.2 Cancel a booking

`DELETE /workspaces/{slug}/events/{eventId}/attendees/{attendeeId}`
**Auth:** Any workspace member (can cancel own booking; teachers can cancel any)
**Returns:** `200` with the cancelled attendee object (not `204`)

**Credit restoration logic** (transparent to the caller):

- Checks the event-level cancellation override first, then the workspace policy.
- If a full-restore window is configured and the event is far enough away → 1 credit is restored to the original grant + a `REVERSAL` transaction is written.
- If no policy or outside the window → no credit restored.

**Response `200`:** Updated attendee object with `cancelledAt` set and `restorationStatus`:

- `RESTORED` — credit was returned
- `NONE` — no credit returned

---

### 4.3 Set event cancellation policy override

`PUT /workspaces/{slug}/events/{eventId}/cancellation-policy`
**Auth:** OWNER or TEACHER

Overrides the workspace-level cancellation policy for one specific event. Call again to update; the record is upserted.

**Request body (all fields optional):**

```json
{
  "noRestore": true
}
```

| Field       | Type      | Description                                                                                  |
| ----------- | --------- | -------------------------------------------------------------------------------------------- |
| `noRestore` | `boolean` | If `true`, cancellations on this event never restore credits, regardless of workspace policy |

**Response `200`:** Created/updated override object.

> **Workspace-level cancellation policy** is configured on `WorkspaceConfig` (not via this endpoint). Fields: `fullRestoreBeforeHours`, `partialRestoreBeforeHours`, `partialRestorePercent`. The event override only controls whether to bypass the workspace policy entirely for that event.

---

## 5. Manual Entitlement Grants

### 5.1 Grant credits to a member

`POST /workspaces/{slug}/members/{memberId}/grants`
**Auth:** OWNER or TEACHER

Creates a free entitlement grant not tied to a purchase. Useful for makeup classes, goodwill credits, etc.

**Request body:**

```json
{
  "kind": "CREDIT_BALANCE",
  "credits": 3,
  "validityDays": 30,
  "reason": "Makeup class"
}
```

| Field          | Type              | Required | Notes                               |
| -------------- | ----------------- | -------- | ----------------------------------- |
| `kind`         | `EntitlementKind` | ✅       |                                     |
| `credits`      | `integer ≥ 1`     | ✅       |                                     |
| `validityDays` | `integer ≥ 1`     | ❌       | Days from now; null = never expires |
| `reason`       | `string`          | ❌       | Stored on the ledger transaction    |

**Response `201`:**

```json
{
  "data": {
    "id": "eg_xxx",
    "workspaceId": "ws_xxx",
    "memberId": "mem_xxx",
    "kind": "CREDIT_BALANCE",
    "source": "MANUAL_GRANT",
    "status": "ACTIVE",
    "creditsTotal": 3,
    "creditsRemaining": 3,
    "validFrom": "2026-04-11T10:00:00.000Z",
    "validUntil": "2026-05-11T10:00:00.000Z",
    "restrictedDanceTypes": [],
    "maxUsagePerWeek": null,
    "purchaseId": null,
    "grantedById": "usr_xxx"
  },
  "error": null
}
```

---

### 5.2 Revoke a grant

`DELETE /workspaces/{slug}/members/{memberId}/grants/{grantId}`
**Auth:** OWNER or TEACHER
**Returns:** `200` (not `204`) with the updated grant object

Sets the grant to `REVOKED`, zeros `creditsRemaining`, and writes a `REVERSAL` transaction. Already-consumed bookings are unaffected.

**Response `200`:** Updated grant with `status: "REVOKED"` and `creditsRemaining: 0`.

---

## 6. WhatsApp

### 6.1 Opt a member in (set WhatsApp phone)

`PATCH /workspaces/{slug}/members/{memberId}/whatsapp`
**Auth:** OWNER or TEACHER

Records the member's WhatsApp phone number and consent timestamp.

- If the member has a linked user account → creates/updates a `WHATSAPP` Account record on the User (platform-level consent).
- If the member is a walk-in with no user account → stores the phone on `member.phone`.

**Request body:**

```json
{
  "phone": "+33612345678"
}
```

Phone must be in E.164 format (`+` followed by country code and number).

**Response `200`:**

```json
{
  "data": {
    "id": "mem_xxx",
    "whatsappPhone": "+33612345678",
    "whatsappOptedInAt": "2026-04-11T10:00:00.000Z",
    "whatsappOptedOutAt": null
  },
  "error": null
}
```

---

### 6.2 Opt a member out

`DELETE /workspaces/{slug}/members/{memberId}/whatsapp`
**Auth:** OWNER or TEACHER
**Returns:** `200`

Sets `whatsappOptedOutAt` on the WHATSAPP Account. The member can be re-opted in later (opt-out timestamp is cleared on re-opt-in).

**Response `200`:**

```json
{
  "data": {
    "id": "mem_xxx",
    "whatsappPhone": "+33612345678",
    "whatsappOptedInAt": "2026-04-11T10:00:00.000Z",
    "whatsappOptedOutAt": "2026-04-11T12:00:00.000Z"
  },
  "error": null
}
```

---

### 6.3 Send a WhatsApp template message

`POST /workspaces/{slug}/members/{memberId}/whatsapp/send`
**Auth:** OWNER or TEACHER

Sends a pre-approved Meta template message to the member.

**Prerequisites:**

- Member must have a WhatsApp phone number set.
- Member must not be opted out.

**Request body:**

```json
{
  "templateName": "booking_confirmation",
  "parameters": ["Alice", "Salsa Class", "Monday", "19:00"]
}
```

| Field          | Type       | Required | Notes                                                |
| -------------- | ---------- | -------- | ---------------------------------------------------- |
| `templateName` | `string`   | ✅       | Must be a pre-approved Meta template name            |
| `parameters`   | `string[]` | ❌       | Ordered variable substitutions for the template body |

**Response `201`:** The created message record.

```json
{
  "data": {
    "id": "msg_xxx",
    "conversationId": "conv_xxx",
    "direction": "OUTBOUND",
    "type": "TEMPLATE",
    "templateName": "booking_confirmation",
    "body": "[\"Alice\",\"Salsa Class\",\"Monday\",\"19:00\"]",
    "status": "PENDING",
    "externalId": null,
    "sentAt": null,
    "createdAt": "2026-04-11T10:00:00.000Z"
  },
  "error": null
}
```

**Error codes:**

| HTTP | Code                       | Meaning                                   |
| ---- | -------------------------- | ----------------------------------------- |
| 422  | `member-no-whatsapp-phone` | No phone number recorded for this member  |
| 422  | `member-opted-out`         | Member has opted out of WhatsApp messages |
| 404  | `member-not-found`         |                                           |

> The actual dispatch to Meta's API is best-effort and asynchronous. The endpoint returns `201` as soon as the message record is created. `status` will update to `SENT` if the Meta API call succeeds.

---

### 6.4 Query WhatsApp usage records

`GET /workspaces/{slug}/whatsapp/usage`
**Auth:** OWNER or TEACHER

Returns monthly conversation count and estimated cost per category.

**Query parameters:**

| Param   | Type                | Description                                                    |
| ------- | ------------------- | -------------------------------------------------------------- |
| `month` | `string` (optional) | Filter to a specific month in `YYYY-MM` format, e.g. `2026-04` |

**Response `200`:**

```json
{
  "data": [
    {
      "id": "wau_xxx",
      "workspaceId": "ws_xxx",
      "month": "2026-04",
      "category": "UTILITY",
      "conversationCount": 14,
      "estimatedCostEur": "0.0840",
      "createdAt": "2026-04-01T00:00:00.000Z",
      "updatedAt": "2026-04-11T10:00:00.000Z"
    }
  ],
  "error": null
}
```

`category` values: `UTILITY | MARKETING | SERVICE`
Ordered by month descending, category ascending.

---

### 6.5 WhatsApp webhook (Meta integration — no auth)

These endpoints are called directly by Meta's infrastructure, not by the frontend. Documented here for completeness.

**GET /whatsapp/webhook** — Meta handshake
Query params: `hub.mode`, `hub.verify_token`, `hub.challenge`
Returns: the raw `hub.challenge` string as plain text with `200`.
Returns `403` if `hub.verify_token` does not match the server's configured token.

**POST /whatsapp/webhook** — Inbound messages & delivery updates
Body: Meta webhook payload
Returns: `200 { "status": "ok" }`

---

## 7. Shared Enums Reference

```
MemberStatus:       LEAD | TRIAL | ACTIVE | LAPSED | DEACTIVATED
AcquisitionSource:  PUBLIC_EVENT | TRIAL_CLASS | MANUAL | INVITATION
EntitlementKind:    CREDIT_BALANCE | DROP_IN_PASS | COHORT_PASS | TRIAL_PASS
EntitlementStatus:  ACTIVE | CONSUMED | EXPIRED | REVOKED
PurchaseStatus:     PENDING | PAID | CANCELLED | REFUNDED
RestorationStatus:  NONE | PENDING | RESTORED | DENIED
DanceRole:          LEADER | FOLLOWER
ConversationChannel: WHATSAPP
MessageDirection:   INBOUND | OUTBOUND
MessageType:        TEMPLATE | FREE_TEXT | INTERACTIVE
MessageStatus:      PENDING | SENT | DELIVERED | READ | FAILED
WhatsAppConversationCategory: UTILITY | MARKETING | SERVICE
```

---

## 8. Access Control Summary

| Endpoint group                           | OWNER | TEACHER | STUDENT |
| ---------------------------------------- | ----- | ------- | ------- |
| Member list + search                     | ✅    | ✅      | ❌      |
| Member status transition                 | ✅    | ✅      | ❌      |
| Member status history                    | ✅    | ✅      | ❌      |
| Products CRUD                            | ✅    | ✅      | ❌      |
| Purchases (create/confirm/cancel/refund) | ✅    | ✅      | ❌      |
| Book event (self)                        | ✅    | ✅      | ✅      |
| Cancel booking (own)                     | ✅    | ✅      | ✅      |
| Event cancellation policy override       | ✅    | ✅      | ❌      |
| Manual grants (create/revoke)            | ✅    | ✅      | ❌      |
| WhatsApp opt-in/out                      | ✅    | ✅      | ❌      |
| WhatsApp send message                    | ✅    | ✅      | ❌      |
| WhatsApp usage                           | ✅    | ✅      | ❌      |

> **Access guard:** Members with status `LEAD`, `LAPSED`, or `DEACTIVATED` are blocked from all workspace endpoints (403), even if they have a STUDENT role. Only `ACTIVE` and `TRIAL` members can access workspace content.
