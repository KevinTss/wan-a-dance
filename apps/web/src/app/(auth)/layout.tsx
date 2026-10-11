import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-border-subtle bg-surface p-8 shadow-md">
        {children}
      </div>
    </main>
  );
}
