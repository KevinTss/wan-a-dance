import './test-styles.ts';
import { setProjectAnnotations } from '@storybook/nextjs-vite';
import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import * as projectAnnotations from './preview.tsx';

setProjectAnnotations([
  a11yAddonAnnotations,
  projectAnnotations,
  { initialGlobals: { theme: 'dark' } },
]);
