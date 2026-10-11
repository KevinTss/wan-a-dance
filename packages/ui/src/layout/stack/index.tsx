import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn.ts';

const stackVariants = cva('flex', {
  variants: {
    direction: { column: 'flex-col', row: 'flex-row' },
    gap: { 0: 'gap-0', 1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 6: 'gap-6', 8: 'gap-8' },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    },
    wrap: { true: 'flex-wrap' },
  },
  defaultVariants: { direction: 'column', gap: 4 },
});

export interface StackProps extends ComponentProps<'div'>, VariantProps<typeof stackVariants> {}

export function Stack({ className, direction, gap, align, justify, wrap, ...props }: StackProps) {
  return (
    <div
      className={cn(stackVariants({ direction, gap, align, justify, wrap }), className)}
      {...props}
    />
  );
}

export function Inline(props: Omit<StackProps, 'direction'>) {
  return <Stack direction="row" align="center" gap={2} {...props} />;
}
