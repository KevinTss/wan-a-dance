import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import { base } from './index.js';

export const tailwindRestrictions = {
  restrict: [
    {
      pattern: '^.*\\[(#|rgb|hsl|oklch|\\d+px|\\d+rem).*\\].*$',
      message: 'Arbitrary values are not allowed. Use a design token.',
    },
    {
      pattern:
        '^(.*:)?(bg|text|border|ring|fill|stroke|from|to|via|outline|shadow|divide|placeholder|decoration|accent|caret)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(-\\d+)?(/\\d+)?$',
      message:
        'Raw palette colours are not allowed. Use semantic tokens (bg-surface, text-muted…).',
    },
  ],
};

export const reactConfig = tseslint.config(...base, {
  files: ['**/*.tsx', '**/*.ts'],
  languageOptions: { globals: { ...globals.browser } },
  plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
  settings: { react: { version: 'detect' } },
  rules: {
    ...react.configs.flat.recommended.rules,
    ...react.configs.flat['jsx-runtime'].rules,
    ...reactHooks.configs.recommended.rules,
    ...jsxA11y.flatConfigs.recommended.rules,
    'react/prop-types': 'off',
  },
});

export default reactConfig;
