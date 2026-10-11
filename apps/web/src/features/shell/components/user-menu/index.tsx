'use client';

import { Check, Languages, LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@wad/i18n';
import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@wad/ui';

export type ThemeChoice = 'light' | 'dark' | 'system';

export interface UserMenuProps {
  name: string;
  email: string;
  image?: string | null;
  theme: ThemeChoice;
  locale: Locale;
  onThemeChange: (theme: ThemeChoice) => void;
  onLocaleChange: (locale: Locale) => void;
  onSignOut: () => void;
}

const themeIcons = { light: <Sun />, dark: <Moon />, system: <Monitor /> } as const;
const THEMES: readonly ThemeChoice[] = ['light', 'dark', 'system'];
const LANGUAGES: readonly Locale[] = ['en', 'fr'];

export function UserMenu({
  name,
  email,
  image,
  theme,
  locale,
  onThemeChange,
  onLocaleChange,
  onSignOut,
}: UserMenuProps) {
  const t = useTranslations();
  const selected = <Check aria-hidden />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-surface-hover">
        <Avatar name={name || email} src={image} size="sm" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-text">{name || email}</span>
          <span className="truncate text-xs text-text-muted">{email}</span>
        </span>
        <span className="sr-only">{t('shell.userMenu.label')}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel>{t('shell.userMenu.theme')}</DropdownMenuLabel>
        {THEMES.map((choice) => (
          <DropdownMenuItem
            key={choice}
            icon={themeIcons[choice]}
            onSelect={() => onThemeChange(choice)}
          >
            <span className="flex items-center justify-between">
              {t(`common.theme.${choice}`)}
              {theme === choice ? selected : null}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('shell.userMenu.language')}</DropdownMenuLabel>
        {LANGUAGES.map((choice) => (
          <DropdownMenuItem
            key={choice}
            icon={<Languages />}
            onSelect={() => onLocaleChange(choice)}
            lang={choice}
          >
            <span className="flex items-center justify-between">
              {t(`common.language.${choice}`)}
              {locale === choice ? selected : null}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={<LogOut />} onSelect={onSignOut}>
          {t('shell.userMenu.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
