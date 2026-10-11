'use client';

import { Home, Languages, SunMoon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useCallback, useState, useTransition, type ReactNode } from 'react';
import { authClient } from '@wad/auth/client';
import type { Locale } from '@wad/i18n';
import {
  AppShell,
  CommandBar,
  toast,
  useCommandBarShortcut,
  type CommandItem,
  type NavItem,
} from '@wad/ui';
import { setLocale } from '@/features/settings';
import { UserMenu, type ThemeChoice } from '../components/user-menu';

export interface WorkspaceShellProps {
  user: { name: string; email: string; image?: string | null };
  version: string;
  children: ReactNode;
}

export function WorkspaceShell({ user, version, children }: WorkspaceShellProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme = 'system', resolvedTheme, setTheme } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);
  const [, startTransition] = useTransition();

  useCommandBarShortcut(useCallback(() => setCommandOpen((open) => !open), []));

  const changeLocale = (next: Locale) => {
    startTransition(async () => {
      const result = await setLocale({ locale: next });
      if (result.ok) router.refresh();
      else toast.error(t(`errors.${result.code}`));
    });
  };

  const signOut = async () => {
    await authClient.signOut();
    router.replace('/sign-in');
    router.refresh();
  };

  const nav: NavItem[] = [
    { id: 'home', label: t('shell.nav.home'), href: '/', icon: <Home />, active: pathname === '/' },
  ];

  const commands: CommandItem[] = [
    {
      id: 'home',
      label: t('shell.nav.home'),
      group: t('shell.command.groupGo'),
      icon: <Home />,
      onSelect: () => router.push('/'),
    },
    {
      id: 'theme',
      label: t('shell.command.toggleTheme'),
      group: t('shell.command.groupActions'),
      icon: <SunMoon />,
      onSelect: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
    },
    {
      id: 'language',
      label: t('shell.command.switchLanguage'),
      group: t('shell.command.groupActions'),
      icon: <Languages />,
      onSelect: () => changeLocale(locale === 'en' ? 'fr' : 'en'),
    },
  ];

  return (
    <>
      <AppShell
        navLabel={t('shell.nav.label')}
        openNavLabel={t('shell.nav.open')}
        closeNavLabel={t('shell.nav.close')}
        header={
          <span className="truncate text-base font-semibold text-text">{t('common.appName')}</span>
        }
        nav={nav}
        renderLink={(item, content, className) => (
          <Link
            key={item.id}
            href={item.href as '/'}
            className={className}
            aria-current={item.active ? 'page' : undefined}
          >
            {content}
          </Link>
        )}
        footer={
          <div className="flex flex-col gap-2">
            <UserMenu
              name={user.name}
              email={user.email}
              image={user.image}
              theme={theme as ThemeChoice}
              locale={locale}
              onThemeChange={setTheme}
              onLocaleChange={changeLocale}
              onSignOut={() => void signOut()}
            />
            <p className="px-1 text-xs text-text-faint" data-testid="app-version">
              {t('common.version', { version })}
            </p>
          </div>
        }
      >
        {children}
      </AppShell>
      <CommandBar
        open={commandOpen}
        onOpenChange={setCommandOpen}
        items={commands}
        title={t('shell.command.title')}
        placeholder={t('shell.command.placeholder')}
        emptyLabel={t('shell.command.empty')}
      />
    </>
  );
}
