import { Menu, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { IconButton } from '../../primitives/button/index.tsx';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  active?: boolean;
  badge?: ReactNode;
}

export interface AppShellProps {
  header: ReactNode;
  nav: NavItem[];
  footer?: ReactNode;
  children: ReactNode;
  renderLink?: (item: NavItem, content: ReactNode, className: string) => ReactNode;
  navLabel: string;
  openNavLabel: string;
  closeNavLabel: string;
}

const defaultLink = (item: NavItem, content: ReactNode, className: string) => (
  <a href={item.href} className={className} aria-current={item.active ? 'page' : undefined}>
    {content}
  </a>
);

export function AppShell({
  header,
  nav,
  footer,
  children,
  renderLink = defaultLink,
  navLabel,
  openNavLabel,
  closeNavLabel,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className="px-1">{header}</div>
      <nav aria-label={navLabel} className="flex flex-1 flex-col gap-0.5">
        {nav.map((item) =>
          renderLink(
            item,
            <>
              <span className="[&_svg]:size-4">{item.icon}</span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge}
            </>,
            cn(
              'flex h-8 items-center gap-2.5 rounded-md px-2 text-base transition-colors duration-(--duration-fast)',
              item.active
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-muted hover:bg-surface-hover hover:text-text',
            ),
          ),
        )}
      </nav>
      {footer ? <div className="px-1">{footer}</div> : null}
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-canvas">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 bg-sidebar backdrop-blur-xl md:block">
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:p-2 md:pl-0">
        <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <div className="flex items-center gap-2 px-3 py-2 md:hidden">
            <DialogPrimitive.Trigger asChild>
              <IconButton label={openNavLabel} icon={<Menu />} />
            </DialogPrimitive.Trigger>
            <div className="min-w-0 flex-1">{header}</div>
          </div>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-40 animate-fade-in bg-overlay md:hidden" />
            <DialogPrimitive.Content
              aria-describedby={undefined}
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-full animate-fade-in bg-canvas shadow-overlay focus:outline-none md:hidden"
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('a')) setMobileOpen(false);
              }}
            >
              <DialogPrimitive.Title className="sr-only">{navLabel}</DialogPrimitive.Title>
              <div className="absolute top-3 right-3">
                <DialogPrimitive.Close asChild>
                  <IconButton label={closeNavLabel} icon={<X />} size="sm" />
                </DialogPrimitive.Close>
              </div>
              {sidebar}
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
        <main className="flex-1 bg-surface px-4 py-6 md:rounded-xl md:border md:border-border-subtle md:px-10 md:py-8 md:shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
}
