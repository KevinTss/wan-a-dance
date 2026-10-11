---
name: new-component
description: Add a design-system component to packages/ui (or a feature component in apps/web) following the tier, token, story and test rules. Use when asked to create or add a UI component.
---

1. Decide the tier: primitive (single control), pattern (composition), layout, or feature component (`apps/web/src/features/<name>/components/`). Check `packages/ui/src/index.ts` first — reuse or extend before adding.
2. Create `<tier>/<kebab-name>/index.tsx`:
   - Props typed with an exported interface; every user-facing string is a prop.
   - Semantic tokens only (`bg-surface`, `text-muted`…), `cn()`, `cva` for variants, `radix-ui` for behaviour.
3. Create `<kebab-name>.stories.tsx` (CSF3, `tags: ['autodocs']`, title `Primitives|Patterns|Layout|Features/<Domain>/<Name>`):
   - One story per variant/size/state (default, disabled, loading, error, empty).
   - `play` tests for each behaviour: click, keyboard (Tab/Enter/Escape/arrows), focus restore, aria attributes.
   - Mobile-only behaviour: add `tags: ['mobile']`.
4. Export from `packages/ui/src/index.ts` (design system) or the feature `index.ts`.
5. Run: `pnpm --filter @wad/ui exec tsc --noEmit && pnpm --filter @wad/ui exec eslint . && pnpm --filter @wad/storybook test:storybook`.
6. Build Storybook and update visual baselines: `pnpm --filter @wad/storybook build && pnpm test:visual --update-snapshots`; review the new images.
7. Add a changeset if users will see it.
