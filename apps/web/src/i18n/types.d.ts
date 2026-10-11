import type { Locale, Messages } from '@wad/i18n';

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
