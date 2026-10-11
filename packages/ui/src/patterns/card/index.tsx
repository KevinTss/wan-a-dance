import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

export interface CardProps extends Omit<ComponentProps<'section'>, 'title'> {
  title?: string;
  description?: string;
  actions?: ReactNode;
  padded?: boolean;
}

export function Card({
  title,
  description,
  actions,
  padded = true,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <section
      className={cn('rounded-xl border border-border-subtle bg-surface shadow-sm', className)}
      {...props}
    >
      {title ? (
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold text-text">{title}</h2>
            {description ? <p className="text-sm text-text-muted">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className={cn(padded && 'p-5')}>{children}</div>
    </section>
  );
}
