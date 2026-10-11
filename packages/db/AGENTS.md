# packages/db — database rules

- Schema in `prisma/schema.prisma`. Tables keep `@@map` names; IDs are prefixed strings generated in code.
- Create migrations with `pnpm --filter @wad/db db:migrate --name <change>`. Never edit an applied migration.
- Migrations must be backwards-compatible with the running app (expand → migrate data → contract in a later release).
- Data backfills go in the migration SQL, written to be idempotent.
- Money columns: `amountMinor Int` + `currency String`. Timestamps: `@db.Timestamptz(3)`.
- After schema changes: `pnpm --filter @wad/db db:generate`, update factories in `packages/testing`, run `pnpm verify`.
- Only `packages/core`, `packages/auth`, `packages/api` and `packages/testing` import `@wad/db`.
