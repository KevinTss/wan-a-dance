# 0006 — Multi-language and multi-currency from day one

- Status: accepted
- Date: 2026-10-11

## Context

Schools in Belgium need FR/EN (NL soon) and may sell in different currencies.

## Decision

next-intl with catalogs in `@wad/i18n` (TS modules), en + fr, no URL prefix in the app. `Money` type in minor units with per-workspace currency, no FX.

## Consequences

Every string goes through t(); CI checks catalogs. Prices store amount + currency.
