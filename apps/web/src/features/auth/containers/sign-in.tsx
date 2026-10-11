'use client';

import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@wad/auth/client';
import { SignInFlow, type RequestCodeResult, type VerifyResult } from '../components/sign-in-flow';

function safeNext(value: string | null): Route {
  return (value?.startsWith('/') && !value.startsWith('//') ? value : '/') as Route;
}

export function ConnectedSignInFlow() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));

  const onRequestCode = async (email: string): Promise<RequestCodeResult> => {
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' });
    if (!error) return 'sent';
    return error.status === 429 ? 'rate-limited' : 'error';
  };

  const onVerify = async (email: string, otp: string): Promise<VerifyResult> => {
    const { error } = await authClient.signIn.emailOtp({ email, otp });
    if (!error) {
      router.replace(next);
      router.refresh();
      return 'ok';
    }
    if (error.code === 'TOO_MANY_ATTEMPTS') return 'too-many-attempts';
    return error.status === 400 || error.status === 401 || error.status === 403
      ? 'invalid'
      : 'error';
  };

  return <SignInFlow onRequestCode={onRequestCode} onVerify={onVerify} />;
}
