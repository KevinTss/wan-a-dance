import { DropdownMenu as Menu } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { Kbd } from '../kbd/index.tsx';

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuGroup = Menu.Group;

export function DropdownMenuContent({
  className,
  align = 'start',
  sideOffset = 6,
  ...props
}: ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-48 animate-scale-in rounded-lg border border-border-subtle bg-surface-raised p-1 shadow-overlay',
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  );
}

export interface DropdownMenuItemProps extends ComponentProps<typeof Menu.Item> {
  icon?: ReactNode;
  shortcut?: string;
  tone?: 'default' | 'danger';
}

export function DropdownMenuItem({
  className,
  icon,
  shortcut,
  tone = 'default',
  children,
  ...props
}: DropdownMenuItemProps) {
  return (
    <Menu.Item
      className={cn(
        'flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-base outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-surface-hover [&_svg]:size-4 [&_svg]:text-text-muted',
        tone === 'danger' ? 'text-danger [&_svg]:text-danger' : 'text-text',
        className,
      )}
      {...props}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {shortcut ? <Kbd>{shortcut}</Kbd> : null}
    </Menu.Item>
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof Menu.Label>) {
  return (
    <Menu.Label
      className={cn('px-2 py-1.5 text-xs font-medium text-text-faint', className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof Menu.Separator>) {
  return (
    <Menu.Separator className={cn('-mx-1 my-1 h-px bg-border-subtle', className)} {...props} />
  );
}
