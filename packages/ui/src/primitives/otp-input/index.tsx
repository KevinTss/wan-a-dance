import { OTPInput, type SlotProps } from 'input-otp';
import { cn } from '../../lib/cn.ts';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  label: string;
  invalid?: boolean;
  disabled?: boolean;
  focusOnMount?: boolean;
  name?: string;
  id?: string;
}

function Slot({ char, isActive, hasFakeCaret, invalid }: SlotProps & { invalid?: boolean }) {
  return (
    <div
      className={cn(
        'relative flex h-11 w-10 items-center justify-center rounded-md border bg-surface text-xl font-medium text-text shadow-sm transition-colors',
        invalid
          ? 'border-danger'
          : isActive
            ? 'border-accent ring-2 ring-accent-subtle'
            : 'border-border',
      )}
    >
      {char}
      {hasFakeCaret ? (
        <span aria-hidden className="absolute h-5 w-px animate-pulse bg-text" />
      ) : null}
    </div>
  );
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  label,
  invalid,
  disabled,
  focusOnMount,
  name,
  id,
}: OtpInputProps) {
  return (
    <OTPInput
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      maxLength={length}
      disabled={disabled}
      // eslint-disable-next-line jsx-a11y/no-autofocus -- opt-in for single-field code screens the user just navigated to
      autoFocus={focusOnMount}
      inputMode="numeric"
      pattern="^\d*$"
      autoComplete="one-time-code"
      aria-label={label}
      aria-invalid={invalid || undefined}
      containerClassName="flex items-center gap-2 has-disabled:opacity-50"
      render={({ slots }) => (
        <>
          {slots.map((slot, index) => (
            <Slot key={index} {...slot} invalid={invalid} />
          ))}
        </>
      )}
    />
  );
}
