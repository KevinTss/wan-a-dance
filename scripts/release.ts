import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const run = (command: string, args: string[], input?: string) =>
  execFileSync(command, args, {
    encoding: 'utf8',
    input,
    stdio: [input ? 'pipe' : 'ignore', 'pipe', 'inherit'],
  }).trim();

const { version } = JSON.parse(readFileSync('apps/web/package.json', 'utf8')) as {
  version: string;
};
const tag = `web@${version}`;

if (run('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`])) {
  console.warn(`${tag} is already released`);
  process.exit(0);
}

const changelog = readFileSync('apps/web/CHANGELOG.md', 'utf8');
const section = new RegExp(
  `^## ${version.replace(/\./g, '\\.')}\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`,
  'm',
).exec(changelog);
const notes = section?.[1]?.trim() ?? `Release ${tag}`;

run('git', ['tag', '-a', tag, '-m', tag]);
run('git', ['push', 'origin', tag]);
run('gh', ['release', 'create', tag, '--title', tag, '--notes-file', '-', '--verify-tag'], notes);

console.warn(`New tag: ${tag}`);
