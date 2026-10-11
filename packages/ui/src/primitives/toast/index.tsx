import { Toaster as SonnerToaster, toast } from 'sonner';

export { toast };

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'rounded-lg border border-border-subtle bg-surface-raised text-text shadow-overlay text-base',
          description: 'text-text-muted text-sm',
        },
      }}
    />
  );
}
