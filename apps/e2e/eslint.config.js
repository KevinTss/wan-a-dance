import playwright from 'eslint-plugin-playwright';
import base from '@wad/config/eslint';

export default [
  ...base,
  { ...playwright.configs['flat/recommended'], files: ['tests/**/*.ts'] },
  {
    files: ['tests/**/*.ts'],
    rules: {
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-force-option': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/no-conditional-in-test': 'off',
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
    },
  },
  { files: ['src/fixtures/**/*.ts'], rules: { 'no-empty-pattern': 'off' } },
];
