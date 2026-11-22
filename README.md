# Wan a Dance

Run your dance school in one calm place. Monorepo for the web app, public API, design system and tests.

## Start

```bash
nvm use               # Node 22
corepack enable       # pnpm 11
pnpm install
pnpm db:up            # Postgres on :5433 (docker)
cp .env.example apps/web/.env.local
pnpm --filter @wad/db db:deploy
pnpm dev              # web → http://localhost:3000 · storybook → http://localhost:6006
```

Sign-in codes are printed in the `pnpm dev` terminal locally (`MAIL_ADAPTER=console`).

## Quality gates

| Command            | What                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| `pnpm verify`      | format, typecheck, lint, unit + integration, Storybook tests (light/dark/mobile + axe), repo checks |
| `pnpm test:e2e`    | Playwright UI journeys, desktop + mobile × en + fr                                                  |
| `pnpm test:api`    | API e2e against the built app                                                                       |
| `pnpm test:visual` | Visual regression in the Playwright Docker image                                                    |

## Docs

- Agent and contributor rules: [AGENTS.md](AGENTS.md)
- Architecture, conventions, testing, design system: [docs/](docs)
- Product scope and stories: [docs/product](docs/product)
- Knowledge base: Confluence space WD · Delivery: Jira project WD
