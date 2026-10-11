# packages/ui — design system rules

- Tiers: `primitives/` → `patterns/` → `layout/`. A tier imports only from tiers before it. No `@wad/*` imports.
- One folder per component: `index.tsx` + `<name>.stories.tsx`. Export it from `src/index.ts`.
- Tokens only (`src/tokens/styles.css`): `bg-surface`, `text-muted`, `border-border-subtle`… Lint rejects palette classes, hex, arbitrary values.
- Need a new token? Add light + dark values, document it in `foundations/*.mdx`, mention it in the PR.
- No copy inside components: every string (labels, aria-labels) is a prop.
- Radix (`radix-ui`) and `cn()` for composition. Variants with `cva`.
- Accessibility: keyboard support, visible focus, labelled controls. Stories run axe as error in light, dark and mobile.
- Story checklist: default, every variant/size, disabled/loading/error/empty, `play` test for each behaviour (click, keyboard, focus restore).
- Visual baselines change → run `pnpm test:visual --update-snapshots` (Docker) and review the diff images.
- Adding from shadcn: generate, restyle to tokens, remove unused parts, write stories. Never copy shadcn defaults verbatim.
