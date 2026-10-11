import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ConnectedSignInFlow } from '@/features/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.signIn');
  return { title: t('title') };
}

export default function SignInPage() {
  return (
    <Suspense>
      <ConnectedSignInFlow />
    </Suspense>
  );
}
