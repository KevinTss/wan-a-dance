import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn.ts';

export const inputBase =
  'w-full rounded-md border border-border bg-surface px-2.5 text-base text-text shadow-sm transition-colors duration-(--duration-fast) placeholder:text-text-faint hover:border-border-strong focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-subtle disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-danger-subtle';

export interface InputProps extends ComponentProps<'input'> {
  invalid?: boolean;
}

export function Input({ className, invalid, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(inputBase, 'h-8', className)}
      {...props}
    />
  );
}
