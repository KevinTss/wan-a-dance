import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const PLAYWRIGHT_IMAGE = 'mcr.microsoft.com/playwright:v1.64.0-noble';
const repo = resolve(import.meta.dirname, '..', '..', '..');
const args = ['test', '--config=playwright.visual.config.ts', ...process.argv.slice(2)];

if (process.env['PLAYWRIGHT_IN_DOCKER'] === '1' || process.env['CI']) {
  execFileSync('./node_modules/.bin/playwright', args, { stdio: 'inherit' });
} else {
  execFileSync(
    'docker',
    [
      'run',
      '--rm',
      '--ipc=host',
      '-e',
      'PLAYWRIGHT_IN_DOCKER=1',
      '-v',
      `${repo}:/work`,
      '-w',
      '/work/apps/e2e',
      PLAYWRIGHT_IMAGE,
      './node_modules/.bin/playwright',
      ...args,
    ],
    { stdio: 'inherit' },
  );
}
