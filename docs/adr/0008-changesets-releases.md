# 0008 — Changesets, semver tags and release notes

- Status: accepted
- Date: 2026-10-11

## Context

Continuous deployment still needs traceable versions and notes.

## Decision

Changesets in every PR; Version PR creates `web@x.y.z` tags, GitHub Releases, Sentry releases; Confluence notes per version.

## Consequences

Commit messages stay free-form (`WD-123 …`).
