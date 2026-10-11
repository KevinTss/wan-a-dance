import betterTailwind from 'eslint-plugin-better-tailwindcss';
import { reactConfig, tailwindRestrictions } from '@wad/config/eslint/react';

export default [
  ...reactConfig,
  {
    files: ['src/**/*.tsx'],
    plugins: { 'better-tailwindcss': betterTailwind },
    settings: { 'better-tailwindcss': { entryPoint: 'src/tokens/styles.css' } },
    rules: {
      ...betterTailwind.configs['correctness-error'].rules,
      'better-tailwindcss/no-restricted-classes': ['error', tailwindRestrictions],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@wad/*'],
              message: 'The design system must not depend on other workspace packages.',
            },
          ],
        },
      ],
    },
  },
];
