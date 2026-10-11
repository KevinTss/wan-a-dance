import betterTailwind from 'eslint-plugin-better-tailwindcss';
import boundaries from 'eslint-plugin-boundaries';
import i18next from 'eslint-plugin-i18next';
import { nextConfig } from '@wad/config/eslint/next';
import { tailwindRestrictions } from '@wad/config/eslint/react';

export default [
  ...nextConfig,
  { ignores: ['next-env.d.ts', '.next/**'] },
  {
    files: ['src/**/*.tsx'],
    plugins: { 'better-tailwindcss': betterTailwind, i18next },
    settings: { 'better-tailwindcss': { entryPoint: 'src/app/globals.css' } },
    rules: {
      ...betterTailwind.configs['correctness-error'].rules,
      'better-tailwindcss/no-restricted-classes': ['error', tailwindRestrictions],
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-only',
          'jsx-attributes': { include: ['title', 'alt', 'placeholder', 'aria-label', 'label'] },
        },
      ],
    },
  },
  {
    files: ['src/**/*.stories.tsx', 'src/**/*.test.tsx'],
    rules: { 'i18next/no-literal-string': 'off' },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'feature', pattern: 'src/features/*', capture: ['feature'] },
        { type: 'lib', pattern: 'src/lib/**' },
        { type: 'server', pattern: 'src/server/**' },
        { type: 'i18n', pattern: 'src/i18n/**' },
      ],
      'import/resolver': { typescript: { project: './tsconfig.json' } },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            {
              from: { element: { type: 'feature' } },
              disallow: { to: { element: { type: 'app' } } },
            },
            {
              from: { element: { type: 'lib' } },
              disallow: { to: { element: { types: { anyOf: ['app', 'feature'] } } } },
            },
            {
              from: { element: { type: 'server' } },
              disallow: { to: { element: { types: { anyOf: ['app', 'feature'] } } } },
            },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@radix-ui/*', 'radix-ui'], message: 'Use components from @wad/ui.' },
            {
              group: ['@prisma/*'],
              message: 'Use @wad/core services; database access lives in packages.',
            },
            {
              group: ['@/features/*/*'],
              message:
                'Import a feature through its index (@/features/<name>), never its internals.',
            },
          ],
          paths: [
            { name: 'dayjs', message: 'Use date-fns.' },
            { name: 'jotai', message: 'Use URL state (nuqs) or server state.' },
          ],
        },
      ],
    },
  },
];
