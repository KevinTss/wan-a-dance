# Conventions

- **Files** kebab-case. Components PascalCase, hooks `useX`, types PascalCase, enums UPPER values.
- **Imports** `@wad/<package>` across packages, `@/` inside `apps/web`. `import type` for types.
- **Errors** throw `AppError(code)`; codes are kebab-case in `@wad/core/errors`. Clients render `t('errors.<code>')`.
- **Results** actions return `Result<T>` = `{ ok: true, data } | { ok: false, code, message, fieldErrors? }`. `/api/v1` uses the same envelope.
- **IDs** `generateId(ID_PREFIXES.X)` → `member_<uuid>`.
- **Money** `Money { amountMinor, currency }`, `formatMoney(money, locale)`. Per-workspace currency, no FX.
- **Dates** UTC in the DB, formatted with the workspace timezone (`formatDate`, next-intl `useFormatter`).
- **i18n** keys namespaced by feature (`members.list.empty`). Placeholders `{name}` identical across locales (CI checks).
- **Comments** only the _why_. No commented-out code. TODO needs a Jira key (`WD-123`).
- **Commits** `WD-123 Imperative summary`. **Branches** `WD-123-short-slug`.
- **Changesets** every PR: `pnpm changeset` (or `--empty`). One plain-language line, user-visible wording.
