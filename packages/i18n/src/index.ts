import enCommon from '../messages/en/common.ts';
import enAuth from '../messages/en/auth.ts';
import enEmail from '../messages/en/email.ts';
import enErrors from '../messages/en/errors.ts';
import enShell from '../messages/en/shell.ts';
import frCommon from '../messages/fr/common.ts';
import frAuth from '../messages/fr/auth.ts';
import frEmail from '../messages/fr/email.ts';
import frErrors from '../messages/fr/errors.ts';
import frShell from '../messages/fr/shell.ts';

export const LOCALES = ['en', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'wad_locale';

const en = { common: enCommon, auth: enAuth, email: enEmail, errors: enErrors, shell: enShell };
const fr = { common: frCommon, auth: frAuth, email: frEmail, errors: frErrors, shell: frShell };

export type Messages = typeof en;

export const messages: Record<Locale, Messages> = { en, fr };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(candidates: readonly (string | null | undefined)[]): Locale {
  for (const candidate of candidates) {
    if (!candidate) continue;
    for (const part of candidate.split(',')) {
      const tag = part.split(';')[0]?.trim().toLowerCase().split('-')[0];
      if (isLocale(tag)) return tag;
    }
  }
  return DEFAULT_LOCALE;
}

export function formatDate(
  date: Date,
  locale: Locale,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  return new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(date);
}

export function formatTime(date: Date, locale: Locale, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone, timeStyle: 'short' }).format(date);
}
