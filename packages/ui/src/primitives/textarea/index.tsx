import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn.ts';
import { inputBase } from '../input/index.tsx';

export interface TextareaProps extends ComponentProps<'textarea'> {
  invalid?: boolean;
}

export function Textarea({ className, invalid, rows = 3, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(inputBase, 'min-h-16 py-1.5', className)}
      {...props}
    />
  );
}
