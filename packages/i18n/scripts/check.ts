import { messages } from '../src/index.ts';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.set(path, value);
    else for (const [k, v] of flatten(value, path)) out.set(k, v);
  }
  return out;
}

const placeholders = (value: string) =>
  [...value.matchAll(/\{(\w+)\}/g)]
    .map((match) => match[1])
    .sort()
    .join(',');

const reference = flatten(messages.en);
const problems: string[] = [];

for (const [locale, catalog] of Object.entries(messages)) {
  if (locale === 'en') continue;
  const other = flatten(catalog);
  for (const [key, value] of reference) {
    const translated = other.get(key);
    if (translated === undefined) problems.push(`${locale}: missing "${key}"`);
    else if (translated.trim() === '') problems.push(`${locale}: empty "${key}"`);
    else if (placeholders(translated) !== placeholders(value))
      problems.push(`${locale}: placeholders differ in "${key}"`);
  }
  for (const key of other.keys())
    if (!reference.has(key)) problems.push(`${locale}: unknown key "${key}"`);
}

if (problems.length > 0) {
  console.error(`i18n check failed:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`);
  process.exit(1);
}
console.warn(
  `i18n check passed: ${String(reference.size)} keys × ${String(Object.keys(messages).length)} locales`,
);
