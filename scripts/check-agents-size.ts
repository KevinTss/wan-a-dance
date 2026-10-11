import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ROOT_BUDGET = 150;
const SCOPED_BUDGET = 60;

const files = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '*AGENTS.md'],
  { encoding: 'utf8' },
)
  .split('\n')
  .filter(Boolean);

const problems = files.flatMap((file) => {
  const lines = readFileSync(file, 'utf8').split('\n').length;
  const budget = file === 'AGENTS.md' ? ROOT_BUDGET : SCOPED_BUDGET;
  return lines > budget ? [`${file}: ${String(lines)} lines (budget ${String(budget)})`] : [];
});

if (problems.length > 0) {
  console.error(
    `AGENTS.md files over their line budget — move detail to docs/:\n${problems.map((p) => `  - ${p}`).join('\n')}`,
  );
  process.exit(1);
}
console.warn(`check-agents-size: ${String(files.length)} AGENTS.md files within budget`);
