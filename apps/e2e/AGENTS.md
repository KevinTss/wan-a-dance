# apps/e2e — Playwright rules

- `tests/ui/*.spec.ts`: one or more tests per story, titled `[R1-XXX-NN] what the user achieves`. Runs on desktop + mobile × en + fr.
- Use fixtures from `src/fixtures`: `signIn`, `t(en, fr)`, `db`, `mintApiKey`, `expectAccessible`.
- Call `expectAccessible(page)` on every new screen the test reaches.
- Locators: `getByRole`, `getByLabel`, `getByText` with translated strings via `t()`. No CSS selectors, no `waitForTimeout`, no `force`.
- Data: create it through the UI under test or factories. Never depend on data from another test.
- `tests/api`: every endpoint → 401/403/400/404/409/happy path + schema shape. Tokens come from `mintApiKey`.
- `tests/visual`: generated from Storybook; don't hand-write. Update baselines only via `pnpm test:visual --update-snapshots`.
- Flaky = failing. Fix the cause, never add retries or sleeps.
