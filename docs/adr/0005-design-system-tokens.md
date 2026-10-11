# 0005 — Token-only design system

- Status: accepted
- Date: 2026-10-11

## Context

Previous UI used shadcn defaults and raw colours.

## Decision

`@wad/ui` with semantic Tailwind v4 tokens; default palette removed; lint rejects palette classes, hex and arbitrary values; strings only via props.

## Consequences

Consistent light/dark theming. New visual needs go through tokens.
