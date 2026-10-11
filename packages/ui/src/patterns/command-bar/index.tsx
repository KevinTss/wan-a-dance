import { Command } from 'cmdk';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Search } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { Kbd } from '../../primitives/kbd/index.tsx';

export interface CommandItem {
  id: string;
  label: string;
  group: string;
  icon?: ReactNode;
  shortcut?: string;
  keywords?: string[];
  onSelect: () => void;
}

export interface CommandBarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder: string;
  emptyLabel: string;
  title: string;
}

export function useCommandBarShortcut(onToggle: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onToggle();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onToggle]);
}

export function CommandBar({
  open,
  onOpenChange,
  items,
  placeholder,
  emptyLabel,
  title,
}: CommandBarProps) {
  const groups = [...new Set(items.map((item) => item.group))];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 animate-fade-in bg-overlay" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-x-4 top-[15dvh] z-50 mx-auto max-w-xl animate-scale-in overflow-hidden rounded-xl border border-border-subtle bg-surface-raised shadow-overlay"
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <Command label={title} loop>
            <div className="flex items-center gap-2 border-b border-border-subtle px-4">
              <Search aria-hidden className="size-4 text-text-faint" />
              <Command.Input
                placeholder={placeholder}
                className="h-12 flex-1 bg-transparent text-lg text-text outline-none placeholder:text-text-faint"
              />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="max-h-80 overflow-y-auto p-2">
              <Command.Empty className="px-3 py-8 text-center text-base text-text-muted">
                {emptyLabel}
              </Command.Empty>
              {groups.map((group) => (
                <Command.Group
                  key={group}
                  heading={group}
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-faint"
                >
                  {items
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <Command.Item
                        key={item.id}
                        value={`${item.label} ${item.id}`}
                        keywords={item.keywords}
                        onSelect={() => {
                          item.onSelect();
                          onOpenChange(false);
                        }}
                        className={cn(
                          'flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-base text-text data-[selected=true]:bg-surface-hover [&_svg]:size-4 [&_svg]:text-text-muted',
                        )}
                      >
                        {item.icon}
                        <span className="flex-1">{item.label}</span>
                        {item.shortcut ? <Kbd>{item.shortcut}</Kbd> : null}
                      </Command.Item>
                    ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
