import { useId, type ReactElement, type ReactNode, cloneElement } from 'react';
import { cn } from '../../lib/cn.ts';
import { Label } from '../../primitives/label/index.tsx';

export interface FormFieldProps {
  label: string;
  hint?: string;
  error?: string | undefined;
  required?: boolean;
  className?: string;
  children: ReactElement<{
    id?: string;
    'aria-describedby'?: string;
    invalid?: boolean;
    required?: boolean;
  }>;
  action?: ReactNode;
}

export function FormField({
  label,
  hint,
  error,
  required,
  className,
  children,
  action,
}: FormFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>
          {label}
          {required ? (
            <span aria-hidden className="ml-0.5 text-danger">
              *
            </span>
          ) : null}
        </Label>
        {action}
      </div>
      {cloneElement(children, {
        id,
        'aria-describedby': describedBy,
        invalid: Boolean(error),
        required,
      })}
      {hint && !error ? (
        <p id={hintId} className="text-sm text-text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
