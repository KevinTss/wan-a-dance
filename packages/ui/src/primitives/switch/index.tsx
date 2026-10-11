import { Switch as SwitchPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn.ts';

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-border-strong p-0.5 transition-colors duration-(--duration-fast) disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-accent',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-4 rounded-full bg-surface shadow-sm transition-transform duration-(--duration-fast) data-[state=checked]:translate-x-4" />
    </SwitchPrimitive.Root>
  );
}
