# 0002 — Better Auth with email codes only in R1

- Status: accepted
- Date: 2026-10-11

## Context

Custom JWT + refresh and NextAuth v4 were fragile; passwords add migration risk.

## Decision

Better Auth with the email OTP plugin (6 digits, 10 min, 5 attempts, hashed). Google, Apple, WhatsApp code and passwords come in R2. Rate limits stored in Postgres.

## Consequences

No password migration at cutover. Every sign-in sends an email (Resend volume). Sessions are database-backed cookies.
