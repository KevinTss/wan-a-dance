# 0001 — Full-stack Next.js in a Turborepo monorepo

- Status: accepted
- Date: 2026-10-11

## Context

The NestJS API and Next.js app were two deploys with a token-refresh bridge and mocked proxy routes.

## Decision

Merge into one pnpm + Turborepo monorepo. Business logic in framework-agnostic `packages/core`; Next.js (`apps/web`) for UI, Server Actions and route handlers. Internal packages are just-in-time (TS source).

## Consequences

One deploy and one auth system. Core can move to another runtime (e.g. a worker) without rewrite. Turbo caching keeps CI fast.
