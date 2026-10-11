# Design system

Dia-inspired: quiet chrome, one accent, floating rounded surfaces, keyboard-first, calm density, light and dark.
Browse it in Storybook (`pnpm --filter @wad/storybook dev`). Foundations pages document colours, typography and principles.

## Tokens (`packages/ui/src/tokens/styles.css`)

Semantic colours only: `canvas`, `surface`, `surface-raised|sunken|hover`, `sidebar`, `overlay`, `border(-subtle|-strong)`, `text(-muted|-faint|-inverse)`, `accent(-hover|-subtle|-fg)`, `success|warning|danger|info(-subtle)`.
Type scale `xs 12 · sm 13 · base 14 · lg 16 · xl 20 · 2xl 24 · display 32`. Radius `sm 6 · md 8 · lg 12 · xl 16`. Shadows `sm · md · overlay`. Motion 150/200ms ease-out.
The default Tailwind palette is removed: `bg-zinc-100` doesn't exist and lint rejects it.

## Components (R0)

- Primitives: Button, IconButton, Input, Textarea, Label, Badge, Kbd, Spinner, Skeleton, Avatar, Separator, Tooltip, Dialog, DropdownMenu, Tabs, Switch, Checkbox, OtpInput, Toast.
- Patterns: FormField, EmptyState, PageHeader, Card, CommandBar.
- Layout: Stack/Inline, AppShell (sidebar + mobile drawer).

Planned when a story needs them: DataTable, Select/Combobox, DatePicker, Calendar week view, Sheet, PhoneInput.

## Quality bar

Every component: stories for each state, `play` tests for behaviour, axe clean in light/dark/mobile, visual baselines in 3 projects.
