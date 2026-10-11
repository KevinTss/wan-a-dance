# 0004 — Vercel + Neon hosting

- Status: accepted
- Date: 2026-10-11

## Context

Render free tier sleeps; previews and branching databases speed up review.

## Decision

Vercel Pro for the app/API, Neon Postgres via the Vercel Marketplace with a branch per preview. Cloudflare for DNS.

## Consequences

Serverless constraints: rate limits and caches must live in shared storage.
