# Testing

| Level       | Where                         | Tool                                                                                                  | Runs                  |
| ----------- | ----------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------- |
| Unit        | `packages/*/src/**/*.test.ts` | Vitest                                                                                                | `pnpm test`           |
| Integration | `packages/{core,auth,api}`    | Vitest + real Postgres (template DB cloned per file)                                                  | `pnpm test`           |
| Component   | `*.stories.tsx`               | Storybook + addon-vitest in Playwright Chromium; projects: light, dark, mobile; axe = error           | `pnpm test:storybook` |
| Visual      | `apps/e2e/tests/visual`       | Playwright `toHaveScreenshot` over every story × desktop-light, desktop-dark, mobile-light, in Docker | `pnpm test:visual`    |
| UI e2e      | `apps/e2e/tests/ui`           | Playwright, desktop + mobile × en + fr, axe on every screen                                           | `pnpm test:e2e`       |
| API e2e     | `apps/e2e/tests/api`          | Playwright request against the built app                                                              | `pnpm test:api`       |
| Smoke       | `apps/e2e/tests/smoke`        | Playwright against production                                                                         | after deploy          |

## Postgres

Tests use `TEST_PG_SERVER_URL` if set (CI service, or `pnpm db:up` → `postgresql://wad:wad@localhost:5433/postgres`), otherwise start a Testcontainers Postgres. A migrated template database is created once; each test file clones it (`CREATE DATABASE … TEMPLATE`) and truncates between tests.

## Email codes in e2e

The web server runs with `MAIL_ADAPTER=capture`, writing emails to `apps/e2e/.mailbox`. `waitForCode(email)` reads the latest code.

## Story coverage

`pnpm check:story-coverage` lists every story of the current release and whether it has a `[ID]`-titled UI spec and backend test. CI enforces it when the release is closed (`--enforce`).

## Rules

- Never mock our own code. Replace third parties at their seam with test-library mocks (`vi.fn()` mailer, Stripe test mode later).
- Roles and labels for locators. No sleeps. No retries to hide flakiness (CI fails on flaky tests).
- Coverage gate on `packages/core`: 90%.
