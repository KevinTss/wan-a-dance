import { Dialog as DialogPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { IconButton } from '../button/index.tsx';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  title: string;
  description?: string;
  closeLabel: string;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

export function DialogContent({
  title,
  description,
  closeLabel,
  footer,
  size = 'md',
  className,
  children,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 animate-fade-in bg-overlay" />
      <DialogPrimitive.Content
        {...(description ? {} : { 'aria-describedby': undefined })}
        className={cn(
          'fixed inset-x-4 top-1/2 z-50 mx-auto flex max-h-[85dvh] -translate-y-1/2 animate-scale-in flex-col rounded-xl bg-surface-raised shadow-overlay focus:outline-none',
          widths[size],
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="flex flex-col gap-1">
            <DialogPrimitive.Title className="text-lg font-semibold text-text">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-sm text-text-muted">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <DialogPrimitive.Close asChild>
            <IconButton label={closeLabel} icon={<X />} size="sm" className="-mt-1 -mr-2" />
          </DialogPrimitive.Close>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-3">
            {footer}
          </div>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
