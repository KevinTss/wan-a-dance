import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import { reactConfig } from './react.js';

export const nextConfig = tseslint.config(...reactConfig, {
  plugins: { '@next/next': nextPlugin },
  rules: {
    ...nextPlugin.configs.recommended.rules,
    ...nextPlugin.configs['core-web-vitals'].rules,
  },
});

export default nextConfig;
