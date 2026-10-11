import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const file = input.tool_input?.file_path;
if (!file || !existsSync(file) || file.includes('/node_modules/') || file.includes('/generated/'))
  process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
if (!file.startsWith(root)) process.exit(0);

try {
  execFileSync('pnpm', ['exec', 'prettier', '--write', '--ignore-unknown', file], {
    cwd: root,
    stdio: 'pipe',
  });
} catch {}

if (!/\.(ts|tsx)$/.test(file)) process.exit(0);

let dir = dirname(file);
while (dir.startsWith(root) && !existsSync(join(dir, 'eslint.config.js'))) dir = dirname(dir);
if (!existsSync(join(dir, 'eslint.config.js'))) process.exit(0);

try {
  execFileSync('pnpm', ['exec', 'eslint', '--fix', '--max-warnings=0', relative(dir, file)], {
    cwd: dir,
    stdio: 'pipe',
  });
} catch (error) {
  const output = `${error.stdout ?? ''}${error.stderr ?? ''}`
    .trim()
    .split('\n')
    .slice(0, 40)
    .join('\n');
  process.stderr.write(
    `ESLint errors in ${relative(root, file)} (fix them before continuing):\n${output}\n`,
  );
  process.exit(2);
}
