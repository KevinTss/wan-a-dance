import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="flex size-10 items-center justify-center rounded-lg bg-surface-sunken text-text-muted [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="text-lg font-semibold text-text">{title}</h3>
        {description ? <p className="text-base text-text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
