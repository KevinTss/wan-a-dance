import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn.ts';

export interface SpinnerProps extends ComponentProps<'span'> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizes = { sm: 'size-3.5 border-2', md: 'size-4 border-2', lg: 'size-6 border-2' } as const;

export function Spinner({ size = 'md', label, className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        'inline-block shrink-0 animate-spin rounded-full border-current border-r-transparent',
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
