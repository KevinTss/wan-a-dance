import type { ReactNode } from 'react';
import { WorkspaceShell } from '@/features/shell';
import { requireSession } from '@/server/auth';

const version = `${process.env['NEXT_PUBLIC_APP_VERSION'] ?? '0.0.0'} · ${process.env['NEXT_PUBLIC_COMMIT_SHA'] ?? 'local'}`;

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user } = await requireSession();
  return (
    <WorkspaceShell
      user={{ name: user.name, email: user.email, image: user.image ?? null }}
      version={version}
    >
      {children}
    </WorkspaceShell>
  );
}
