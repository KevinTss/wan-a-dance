import type { Preview } from '@storybook/nextjs-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import { NextIntlClientProvider } from 'next-intl';
import { messages, type Locale } from '@wad/i18n';
import { TooltipProvider } from '@wad/ui';
import './preview.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'error' },
    backgrounds: { disable: true },
    options: {
      storySort: {
        order: ['Foundations', 'Primitives', 'Patterns', 'Layout', 'Features', 'Screens'],
      },
    },
  },
  globalTypes: {
    locale: {
      description: 'Language',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'fr', title: 'Français' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { locale: 'en' },
  decorators: [
    (Story, context) => {
      const locale = (context.globals['locale'] ?? 'en') as Locale;
      return (
        <NextIntlClientProvider
          locale={locale}
          messages={messages[locale]}
          timeZone="Europe/Brussels"
        >
          <TooltipProvider>
            <Story />
          </TooltipProvider>
        </NextIntlClientProvider>
      );
    },
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
      parentSelector: 'html',
    }),
  ],
  tags: ['autodocs'],
};

export default preview;
