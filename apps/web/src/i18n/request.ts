import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { LOCALE_COOKIE, messages, resolveLocale } from '@wad/i18n';

export default getRequestConfig(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale([
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerStore.get('accept-language'),
  ]);
  return { locale, messages: messages[locale], timeZone: 'Europe/Brussels' };
});
