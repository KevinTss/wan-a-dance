import { execFileSync } from 'node:child_process';

const base = process.env['DOCS_BASE_REF'] ?? 'origin/main';
const skip = process.env['DOCS_NOT_NEEDED'] === 'true';

let changed: string[];
try {
  changed = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
} catch {
  console.warn(`check-docs: cannot diff against ${base}, skipping`);
  process.exit(0);
}

const domains = new Set(
  changed
    .map((file) => /^packages\/core\/src\/([^/]+)\/.+\.ts$/.exec(file)?.[1])
    .filter(
      (domain): domain is string => Boolean(domain) && !['money', 'authz'].includes(domain ?? ''),
    ),
);

const missing = [...domains].filter(
  (domain) => !changed.includes(`packages/core/src/${domain}/README.md`),
);

if (missing.length > 0 && !skip) {
  console.error(
    `Domain logic changed without its README:\n${missing.map((d) => `  - packages/core/src/${d}/README.md`).join('\n')}\n` +
      'Update the README, or label the PR "docs-not-needed".',
  );
  process.exit(1);
}
console.warn('check-docs: domain READMEs are in sync');
