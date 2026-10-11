import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const componentRoots = [
  join(root, 'packages/ui/src/primitives'),
  join(root, 'packages/ui/src/patterns'),
  join(root, 'packages/ui/src/layout'),
];

const featuresDir = join(root, 'apps/web/src/features');
if (existsSync(featuresDir)) {
  for (const feature of readdirSync(featuresDir)) {
    const components = join(featuresDir, feature, 'components');
    if (existsSync(components)) componentRoots.push(components);
  }
}

const missing: string[] = [];
for (const dir of componentRoots) {
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir)) {
    const folder = join(dir, name);
    if (!statSync(folder).isDirectory()) continue;
    const hasStory = readdirSync(folder).some((file) => file.endsWith('.stories.tsx'));
    if (!hasStory) missing.push(relative(root, folder));
  }
}

if (missing.length > 0) {
  console.error(
    `Components without a story (*.stories.tsx):\n${missing.map((m) => `  - ${m}`).join('\n')}`,
  );
  process.exit(1);
}
console.warn(
  `check-stories: every component has a story (${String(componentRoots.length)} folders scanned)`,
);
