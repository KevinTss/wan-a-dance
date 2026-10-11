# 0003 — Public API with personal API tokens

- Status: accepted
- Date: 2026-10-11

## Context

CLI, MCP and mobile clients are planned; the web app must not expose an internal REST API.

## Decision

Hono app at `/api/v1`, bearer API tokens only (Better Auth API key plugin, hashed, scoped, rate-limited), cookies ignored. Disabled in production until R4 token management ships.

## Consequences

Full API e2e from R1. Two separate front doors that never share credentials.
