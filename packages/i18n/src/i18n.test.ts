import { describe, expect, it } from 'vitest';
import { formatDate, formatTime, isLocale, resolveLocale } from './index.ts';

describe('resolveLocale', () => {
  it.each([
    [['fr'], 'fr'],
    [[null, 'fr-BE,fr;q=0.9,en;q=0.8'], 'fr'],
    [[undefined, 'de-DE,de;q=0.9'], 'en'],
    [['nl', 'en-GB'], 'en'],
    [[], 'en'],
  ] as const)('%j → %s', (candidates, expected) => {
    expect(resolveLocale(candidates)).toBe(expected);
  });

  it('guards locale values', () => {
    expect(isLocale('fr')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale(3)).toBe(false);
  });
});

describe('date formatting', () => {
  const date = new Date('2026-03-29T00:30:00Z');

  it('uses the workspace timezone, not the server one', () => {
    expect(formatDate(date, 'en', 'Europe/Brussels')).toBe('Mar 29, 2026');
    expect(formatDate(date, 'en', 'America/New_York')).toBe('Mar 28, 2026');
  });

  it('formats time per locale', () => {
    expect(formatTime(date, 'fr', 'Europe/Brussels')).toBe('01:30');
  });
});
