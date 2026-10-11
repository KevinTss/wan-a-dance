# WhatsApp Integration Plan

**Date:** 2026-03-26
**Status:** Planning

---

## 1. Feature Scope

Four distinct use cases, each with different triggering mechanisms and audiences:

| #   | Use case                              | Trigger                          | Audience                    | Direction     |
| --- | ------------------------------------- | -------------------------------- | --------------------------- | ------------- |
| A   | Automated transactional notifications | System event (booking, reminder) | Individual student          | Outbound only |
| B   | Manual targeted broadcast             | Teacher action                   | Filtered subset of students | Outbound only |
| C   | Channel announcements                 | Teacher action or schedule       | All or filtered members     | Outbound only |
| D   | Student chatbot                       | Student message                  | Individual ↔ bot            | Two-way       |

---

## 2. User Stories

### 2.1 Student / Member

**Opt-in and preferences**

- As a student, I can opt in to receive WhatsApp messages from my studio by providing my phone number.
- As a student, I can opt out at any time by replying STOP, and the school will never message me again on WhatsApp.
- As a student, I can see whether my WhatsApp opt-in is active in my member profile.

**Automated notifications**

- As a student, I receive a WhatsApp confirmation immediately after booking a class.
- As a student, I receive a reminder the day before each upcoming class.
- As a student, I receive a cancellation notice if a class I booked is cancelled by the teacher.
- As a student, I receive a notification when I am added to a waitlist because the class is full.

**Chatbot interactions (Phase D)**

- As a student, I can text the studio's WhatsApp number and ask what classes I have coming up.
- As a student, I can ask my remaining credit balance via WhatsApp.
- As a student, I can request to speak to my teacher via WhatsApp and the bot hands off the conversation.
- As a student, I receive a clear response even if I type something the bot does not understand.

---

### 2.2 Teacher

**Targeted messaging**

- As a teacher, I can send a message to a filtered subset of students (e.g. all Salsa Intermediate Leaders).
- As a teacher, I can send a free-text message to students who have texted me in the last 24 hours.
- As a teacher, I must use a pre-approved template when messaging students outside the 24-hour window.
- As a teacher, the UI blocks me from sending free text outside the 24-hour window to prevent Meta policy violations.

**Announcements**

- As a teacher, I can send an announcement to all opted-in members of my workspace.
- As a teacher, I am warned that announcements use marketing-category conversations and cost more per message.

**Configuration**

- As a teacher, I can enable or disable WhatsApp for my workspace.
- As a teacher, I can configure which automated notifications are active for my workspace (e.g. disable reminders if I prefer email).

---

### 2.3 School Admin

**Usage and billing visibility**

- As a school admin, I can see how many WhatsApp conversations were opened per month, broken down by category (utility, marketing, service).
- As a school admin, I can see the estimated Meta cost for any month.
- As a school admin, I can compare usage across workspaces to decide on pricing.

---

### 2.4 System

- As the system, I never send a WhatsApp message to a member who has not opted in or who has opted out.
- As the system, I never send a WhatsApp message to a member whose status is below the template's minimum status requirement.
- As the system, I record every outbound conversation in `WhatsAppUsageRecord` so usage is always auditable.
- As the system, I route inbound messages to the correct workspace based on the phone number that receives them.
- As the system, I honour STOP replies immediately by setting `whatsappOptedOutAt` on the member.

---

## 3. Technical Architecture

### 2.1 WhatsApp access layer

**Recommended provider: Meta Cloud API (direct)**

Meta offers the WhatsApp Business Cloud API for free (no per-message infrastructure cost on their side). The cost is only the per-conversation fee Meta charges. The alternative is going through a BSP (Business Solution Provider: Twilio, 360dialog, MessageBird) which adds a layer fee but simplifies compliance and support — recommended for the first version to reduce operational overhead.

**Recommended BSP for v1: 360dialog or Twilio**

- 360dialog: flat monthly fee (~€50–150) + Meta conversation fees. Good for lower volumes.
- Twilio: pay-as-you-go, no monthly fee, +~€0.005 per message on top of Meta fees. Better for high volumes.

### 2.2 System components

```
┌─────────────────────────────────────────────────────┐
│                   NestJS API                        │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐   │
│  │ WhatsApp    │  │  Message     │  │  Bot      │   │
│  │ Module      │  │  Template    │  │  Engine   │   │
│  │             │  │  Registry    │  │           │   │
│  └──────┬──────┘  └──────────────┘  └─────┬─────┘   │
│         │                                 │         │
│  ┌──────▼─────────────────────────────────▼──────┐  │
│  │            Conversation Service               │  │
│  │   (state machine, session tracking, logs)     │  │
│  └──────────────────────┬────────────────────────┘  │
│                         │                           │
│  ┌──────────────────────▼────────────────────────┐  │
│  │              Message Queue (Bull/Redis)       │  │
│  │   (rate limiting, retry, deduplication)       │  │
│  └──────────────────────┬────────────────────────┘  │
└─────────────────────────┼───────────────────────────┘
                          │
              ┌───────────▼──────────────┐
              │   WhatsApp Business API  │
              │   (Meta Cloud API / BSP) │
              └──────────────────────────┘
```

### 2.3 New database models needed

**Decision log:**

- `WorkspaceWhatsAppConfig` → dropped for v1. Platform credentials (`phoneNumberId`, `accessToken`) live in env vars (shared phone number). Only per-workspace state needed is `whatsappEnabled` — added as a field on the existing `Workspace` model.
- `WhatsAppTemplate` → dropped for v1. Templates are a fixed platform catalogue defined as TypeScript constants. No per-workspace customisation in v1.
- `StudentWhatsAppOptIn` → merged into `Member`. Avoids a join; same compliance guarantees.
- `WhatsAppConversation` / `WhatsAppMessage` → made generic to support future multi-channel (SMS, in-app, etc.) without a rewrite. Channel-specific metadata (e.g. Meta's `conversationId`) stored in a JSON `metadata` column.

```prisma
// On Member — add these fields (no new table needed):
//   whatsappPhone      String?   // E.164 format, e.g. +33612345678
//   whatsappOptedInAt  DateTime? @db.Timestamptz(3)
//   whatsappOptedOutAt DateTime? @db.Timestamptz(3)

model Conversation {
  id            String              @id
  workspaceId   String
  memberId      String
  channel       ConversationChannel // WHATSAPP | SMS | ...
  state         ConversationState   // OPEN | CLOSED
  lastMessageAt DateTime            @db.Timestamptz(3)
  metadata      Json?               // channel-specific data (e.g. metaConversationId)
  createdAt     DateTime            @default(now()) @db.Timestamptz(3)
  updatedAt     DateTime            @updatedAt      @db.Timestamptz(3)

  messages Message[]

  @@index([workspaceId, memberId, channel])
  @@map("conversations")
}

model Message {
  id             String          @id
  conversationId String
  direction      MessageDirection  // INBOUND | OUTBOUND
  type           MessageType       // TEMPLATE | FREE_TEXT | INTERACTIVE
  templateName   String?
  body           String            // raw text or JSON payload
  status         MessageStatus     // PENDING | SENT | DELIVERED | READ | FAILED
  externalId     String?           // Meta message ID or equivalent
  sentAt         DateTime?         @db.Timestamptz(3)
  deliveredAt    DateTime?         @db.Timestamptz(3)
  readAt         DateTime?         @db.Timestamptz(3)
  createdAt      DateTime          @default(now()) @db.Timestamptz(3)

  conversation Conversation @relation(fields: [conversationId], references: [id])

  @@map("messages")
}

// Usage tracking — no limits enforced, admin-visibility only
model WhatsAppUsageRecord {
  id              String   @id
  workspaceId     String
  month           String   // "2026-03" — YYYY-MM
  category        WhatsAppConversationCategory  // UTILITY | MARKETING | SERVICE
  conversationCount Int    @default(0)
  estimatedCostEur  Decimal @db.Decimal(10, 4)
  createdAt       DateTime @default(now()) @db.Timestamptz(3)
  updatedAt       DateTime @updatedAt      @db.Timestamptz(3)

  workspace Workspace @relation(fields: [workspaceId], references: [id])

  @@unique([workspaceId, month, category])
  @@map("whatsapp_usage_records")
}
```

**Template constants (TypeScript, no DB):**

```ts
// src/whatsapp/templates.constants.ts
export const WHATSAPP_TEMPLATES = {
  BOOKING_CONFIRMATION: {
    name: 'booking_confirmation',
    category: 'UTILITY',
    body: 'Hi {{1}}, your spot in {{2}} on {{3}} at {{4}} is confirmed.',
  },
  CLASS_REMINDER: {
    name: 'class_reminder',
    category: 'UTILITY',
    body: 'Reminder: {{1}} is tomorrow at {{2}}. See you there!',
  },
  CLASS_CANCELLED: {
    name: 'class_cancelled',
    category: 'UTILITY',
    body: '{{1}} on {{2}} has been cancelled. Contact your teacher for more info.',
  },
  CLASS_FULL_WAITLIST: {
    name: 'class_full_waitlist',
    category: 'UTILITY',
    body: "{{1}} is now full. You've been added to the waiting list.",
  },
} as const;
```

### 2.4 Webhook endpoints

Meta pushes all inbound messages and delivery status updates to a registered webhook:

```
POST /webhooks/whatsapp    — inbound messages + status callbacks from Meta
GET  /webhooks/whatsapp    — Meta verification handshake (one-time setup only)
```

---

## 3. Feature Implementation by Phase

### Phase A — Automated notifications

Triggered by existing domain events (EventEmitter2). No frontend changes required beyond a configuration UI to enable/disable each template per workspace.

Templates (must be pre-approved by Meta before use):

| Template name          | Category | Example body                                                             |
| ---------------------- | -------- | ------------------------------------------------------------------------ |
| `booking_confirmation` | Utility  | "Hi {{1}}, your spot in **{{2}}** on {{3}} at {{4}} is confirmed."       |
| `class_reminder`       | Utility  | "Reminder: {{1}} is tomorrow at {{2}}. See you there!"                   |
| `class_cancelled`      | Utility  | "{{1}} on {{2}} has been cancelled. Contact your teacher for more info." |
| `class_full_waitlist`  | Utility  | "{{1}} is now full. You've been added to the waiting list."              |

### Phase B — Manual targeted messages

Teacher selects a filter and sends a template or free-text message to matching members.

```
POST /workspaces/:slug/whatsapp/broadcasts
{
  "filter": {
    "danceTypes": ["SALSA"],
    "minLevel": "INTERMEDIATE",
    "danceRole": "LEADER",
    "memberIds": ["..."]      // optional override: send to specific members
  },
  "message": {
    "templateName": "fill_spot_request",  // for contacts outside 24h window
    "freeText": "..."                     // only allowed within 24h window
  }
}
```

> **Meta constraint:** messages to contacts not seen in the last 24 hours **must use an approved template**. Free-text is only valid within an active 24h conversation window. The UI must enforce this — outside 24h → template picker only, free text disabled.

### Phase C — Channel announcements

Same mechanism as Phase B but targeting all workspace members. Uses marketing-category templates. The UI should warn teachers that marketing conversations cost ~2× utility conversations.

### Phase D — Student chatbot

A student texts the workspace WhatsApp number and is served by a bot.

**Sample flow:**

```
Student → "Hi"
Bot     → "Hello! What can I help you with?
           1️⃣ My booked classes
           2️⃣ Book a class
           3️⃣ My remaining credits
           4️⃣ Talk to my teacher"

Student → "1"
Bot     → "Your upcoming classes:
           • Salsa — Thu 3 Apr, 19:00
           • Bachata — Mon 7 Apr, 20:00"
```

**v1 — keyword/button state machine** (deterministic, cheapest, covers ~80% of cases)
**v2 — LLM intent parsing** (natural language, better UX, ~€0.01–0.05/conversation extra)

Recommend v1 first. Swap the intent resolver in the BotEngine for v2 without touching the rest of the system.

---

## 4. WhatsApp API Cost Structure

### 4.1 Meta conversation categories

Meta charges per **24-hour conversation window** (not per message).

| Category  | Who initiates | Use case                        | Approx. cost (FR/EU) |
| --------- | ------------- | ------------------------------- | -------------------- |
| Utility   | Business      | Booking confirmation, reminder  | ~€0.035/conv         |
| Marketing | Business      | Announcements, class promotions | ~€0.079/conv         |
| Service   | Customer      | Student chatbot session         | ~€0.035/conv         |

> Prices vary by country. France/EU are mid-range. Adjust estimates for other markets.

### 4.2 Usage estimates by studio size

**Small studio** — 40 students, 15 classes/month, avg 10 students/class

| Type                       | Volume         | Category  | Cost              |
| -------------------------- | -------------- | --------- | ----------------- |
| Booking confirmations      | 150            | Utility   | €5.25             |
| Reminders (new 24h window) | ~50            | Utility   | €1.75             |
| Announcements ×2           | 80             | Marketing | €6.32             |
| Bot sessions               | 30             | Service   | €1.05             |
| **Total**                  | **~310 convs** |           | **~€14–20/month** |

**Medium studio** — 120 students, 30 classes/month, avg 18/class

| Type                    | Volume           | Category  | Cost              |
| ----------------------- | ---------------- | --------- | ----------------- |
| Booking confirmations   | 540              | Utility   | €18.90            |
| Reminders (new windows) | ~150             | Utility   | €5.25             |
| Announcements ×4        | 480              | Marketing | €37.92            |
| Bot sessions            | 100              | Service   | €3.50             |
| **Total**               | **~1,270 convs** |           | **~€55–70/month** |

**Large studio** — 300 students, 60 classes/month, avg 25/class

| Type                    | Volume           | Category  | Cost                |
| ----------------------- | ---------------- | --------- | ------------------- |
| Booking confirmations   | 1,500            | Utility   | €52.50              |
| Reminders (new windows) | ~400             | Utility   | €14.00              |
| Announcements ×6        | 1,800            | Marketing | €142.20             |
| Bot sessions            | 300              | Service   | €10.50              |
| **Total**               | **~4,000 convs** |           | **~€160–220/month** |

### 4.3 Platform infrastructure overhead

| Item                              | Monthly cost                     |
| --------------------------------- | -------------------------------- |
| Redis / Bull (already present)    | ~€0 additional                   |
| Extra compute for webhook handler | ~€10–20 across all workspaces    |
| BSP fee (360dialog)               | €50–150 flat                     |
| LLM API for bot v2                | ~€0.01–0.05 per bot conversation |

---

## 5. Usage Tracking (No Enforced Tiers in v1)

Pricing tiers are intentionally **not enforced in code** for v1. Startup pricing evolves fast and early customers are often negotiated individually. The implementation records raw usage so any pricing model can be applied on top without touching feature code.

### What gets tracked

Every time the system opens a new 24h conversation window with Meta, it upserts a `WhatsAppUsageRecord` row for that workspace + month + category. This gives a clear, queryable picture of consumption per workspace.

### Admin visibility

```
GET /admin/whatsapp/usage                    — all workspaces, current month
GET /admin/whatsapp/usage?month=2026-03      — all workspaces, specific month
GET /admin/whatsapp/usage/:workspaceId       — one workspace, last 12 months
```

Response example:

```json
{
  "workspaceId": "ws_abc",
  "month": "2026-03",
  "breakdown": [
    { "category": "UTILITY", "conversations": 142, "estimatedCostEur": 4.97 },
    { "category": "MARKETING", "conversations": 80, "estimatedCostEur": 6.32 },
    { "category": "SERVICE", "conversations": 25, "estimatedCostEur": 0.88 }
  ],
  "totalConversations": 247,
  "totalEstimatedCostEur": 12.17
}
```

### Iterating on pricing

When you're ready to introduce billing tiers:

1. Add a `whatsappPlan` field to `Workspace` (enum: `NOTIFY | ENGAGE | AUTOMATE | ENTERPRISE`).
2. Add a guard in `WhatsappService` that checks the plan before opening new conversations.
3. Thresholds and prices are code constants — change them in one place.

No DB migrations to historical usage data, no re-architecture needed.

### Cost reference (for internal calculations)

| Category  | Who initiates | Approx. cost (FR/EU) |
| --------- | ------------- | -------------------- |
| Utility   | Business      | ~€0.035/conv         |
| Marketing | Business      | ~€0.079/conv         |
| Service   | Customer      | ~€0.035/conv         |

---

## 6. Compliance and Opt-In Requirements

Non-negotiable — Meta will restrict or ban a number with high block/spam rates.

- Students **must opt in** before receiving any outbound message.
- Opt-in can be collected via: QR code at the studio, link in booking confirmation email, or by the student messaging the number first.
- Store opt-in timestamp and source in `StudentWhatsAppOptIn`.
- Every automated message must include an opt-out instruction (e.g. "Reply STOP to unsubscribe").
- Honour opt-outs immediately — set `optedOutAt` and exclude from all future sends.
- All template messages must be submitted to Meta for approval (~24–48h review) **before** the feature can go live. Plan for this lead time.

---

## 7. Rollout Sequence

| Phase | Feature                                                | Tier unlocked    | Risk               |
| ----- | ------------------------------------------------------ | ---------------- | ------------------ |
| 1     | WhatsApp config page + automated utility notifications | Notify           | Low                |
| 2     | Manual targeted messages + announcements               | Engage           | Low–Medium         |
| 3     | Bot engine v1 (state machine)                          | Automate         | Medium             |
| 4     | Bot engine v2 (LLM intent parsing)                     | Automate upgrade | Medium             |
| 5     | Dedicated numbers + white-label                        | Enterprise       | High (operational) |

---

## 8. Open Decisions

| #   | Decision   | Options                                      | Recommendation                                   |
| --- | ---------- | -------------------------------------------- | ------------------------------------------------ |
| 1   | BSP choice | 360dialog vs Twilio vs direct Meta Cloud API | 360dialog for v1 (simpler EU compliance)         |
| 2   | Bot engine | State machine vs LLM from day one            | State machine first                              |
| 3   | Opt-in UX  | QR code / email link / in-app prompt         | Email link (lowest friction, already have email) |

> Resolved decisions (architecture choices, pricing model, template storage) are documented in section 9.

## 9. Decisions Log

| #   | Decision                | Choice                                                  | Rationale                                                                                               |
| --- | ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | WhatsApp config storage | Platform env vars for v1                                | Single shared phone number → no per-workspace config. Add `whatsappEnabled` bool to Workspace.          |
| 2   | Conversation model      | Generic `Conversation` + `Message` with `channel` field | Multi-channel vision; WA-specific metadata in JSON `metadata` column.                                   |
| 3   | Opt-in storage          | Fields on `Member`                                      | Mandatory (GDPR + Meta ToS). Merged into Member to avoid a join.                                        |
| 4   | Template storage        | TypeScript constants, no DB                             | Fixed platform catalogue. DB model only needed for workspace-custom templates (future).                 |
| 5   | Pricing enforcement     | None in v1; usage tracking only                         | Startup pricing evolves fast. Record `WhatsAppUsageRecord` per workspace/month/category; bill manually. |
| 6   | BSP choice              | 360dialog or Twilio (TBD)                               | 360dialog for lower volume / EU compliance; Twilio for scale.                                           |
| 7   | Bot engine              | State machine v1, LLM v2                                | Deterministic, cheapest, covers ~80% of cases. Swap intent resolver without touching rest of system.    |
| 8   | Phone number ownership  | Shared for v1, per-workspace for Enterprise             | Simplest operational setup to start.                                                                    |
