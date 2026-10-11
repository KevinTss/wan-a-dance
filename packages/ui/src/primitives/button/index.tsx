import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn.ts';
import { Spinner } from '../spinner/index.tsx';

export const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-(--duration-fast) select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-fg shadow-sm hover:bg-accent-hover',
        secondary: 'border border-border bg-surface text-text shadow-sm hover:bg-surface-hover',
        ghost: 'text-text hover:bg-surface-hover',
        danger: 'bg-danger text-text-inverse shadow-sm hover:bg-danger-hover',
        link: 'h-auto px-0 text-accent underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-7 px-2.5 text-sm',
        md: 'h-8 px-3 text-base',
        lg: 'h-10 px-4 text-base',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  loading = false,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot.Root className={cn(buttonVariants({ variant, size, fullWidth }), className)} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'asChild'> {
  label: string;
  icon: React.ReactNode;
}

export function IconButton({
  label,
  icon,
  size = 'md',
  variant = 'ghost',
  className,
  ...props
}: IconButtonProps) {
  const square = { sm: 'size-7 px-0', md: 'size-8 px-0', lg: 'size-10 px-0' }[size ?? 'md'];
  return (
    <Button
      aria-label={label}
      title={label}
      variant={variant}
      size={size}
      className={cn(square, className)}
      {...props}
    >
      {icon}
    </Button>
  );
}
