import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
if (input.stop_hook_active) process.exit(0);

const changed = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim();
if (!changed) process.exit(0);

try {
  execFileSync(
    'pnpm',
    ['turbo', 'run', 'typecheck', 'lint', '--affected', '--output-logs=errors-only'],
    { stdio: 'pipe' },
  );
} catch (error) {
  const output = `${error.stdout ?? ''}${error.stderr ?? ''}`
    .trim()
    .split('\n')
    .slice(-60)
    .join('\n');
  process.stderr.write(
    `Typecheck/lint failed on changed packages. Fix before finishing:\n${output}\n`,
  );
  process.exit(2);
}
