# 0007 — Testing pyramid against real dependencies

- Status: accepted
- Date: 2026-10-11

## Context

The migration needs strong safety nets; mocks of our own code hid bugs before.

## Decision

Vitest + real Postgres (template DB per file), Storybook interaction + axe tests in 3 projects, Playwright visual (Docker), UI e2e (desktop/mobile × en/fr), API e2e, smoke. Story IDs in test titles with a coverage check.

## Consequences

Slower than mocks, but catches integration bugs (it already caught a rate-limit ID bug in R0).
