import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';
import globals from 'globals';

export const ignores = {
  ignores: [
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
    '**/coverage/**',
    '**/storybook-static/**',
    '**/generated/**',
    '**/playwright-report/**',
    '**/test-results/**',
    '**/*.d.ts',
  ],
};

export const base = tseslint.config(
  ignores,
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { projectService: true },
    },
    plugins: { 'import-x': importX },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-confusing-void-expression': 'off',
      'import-x/no-cycle': 'error',
      'import-x/no-default-export': 'off',
      'no-warning-comments': ['error', { terms: ['todo', 'fixme', 'xxx'], location: 'start' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'dayjs', message: 'Use date-fns.' },
            { name: 'moment', message: 'Use date-fns.' },
            { name: 'jotai', message: 'Use URL state (nuqs) or server state.' },
            { name: 'lodash', message: 'Use native JS or a focused helper in core/lib.' },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/tests/**', '**/e2e/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.config.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);

export default base;
