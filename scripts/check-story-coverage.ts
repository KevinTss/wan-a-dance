import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const release =
  process.env['CURRENT_RELEASE'] ??
  readFileSync(join(root, 'docs/product/CURRENT_RELEASE'), 'utf8').trim();
const enforce =
  process.argv.includes('--enforce') || process.env['STORY_COVERAGE_ENFORCE'] === 'true';

const plan = readFileSync(join(root, 'docs/product/IMPLEMENTATION_PLAN.md'), 'utf8');
const storyIds = [...plan.matchAll(new RegExp(`^- (${release}-[A-Z0-9]+-\\d+):`, 'gm'))].map(
  (match) => match[1] ?? '',
);

const testFiles = execFileSync(
  'git',
  [
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
    '*.spec.ts',
    '*.test.ts',
    '*.test.tsx',
  ],
  {
    cwd: root,
    encoding: 'utf8',
  },
)
  .split('\n')
  .filter(Boolean);

const uiSpecs = testFiles.filter((file) => file.startsWith('apps/e2e/tests/ui/'));
const backendTests = testFiles.filter((file) => !file.startsWith('apps/e2e/tests/ui/'));
const read = (files: string[]) =>
  files.map((file) => readFileSync(join(root, file), 'utf8')).join('\n');
const uiText = read(uiSpecs);
const backendText = read(backendTests);

const rows = storyIds.map((id) => ({
  id,
  ui: uiText.includes(`[${id}]`),
  backend: backendText.includes(`[${id}]`),
}));
const uncovered = rows.filter((row) => !row.ui);

console.warn(
  `Story coverage for ${release}: ${String(rows.length - uncovered.length)}/${String(rows.length)} stories have a UI e2e spec`,
);
for (const row of rows)
  console.warn(`  ${row.ui ? '✓' : '✗'} ui  ${row.backend ? '✓' : '·'} backend  ${row.id}`);

if (enforce && uncovered.length > 0) {
  console.error(`\nMissing UI e2e specs:\n${uncovered.map((row) => `  - [${row.id}]`).join('\n')}`);
  process.exit(1);
}
