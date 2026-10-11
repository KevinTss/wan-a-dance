'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button, FormField, Input, OtpInput } from '@wad/ui';

export type RequestCodeResult = 'sent' | 'rate-limited' | 'error';
export type VerifyResult = 'ok' | 'invalid' | 'too-many-attempts' | 'error';

export interface SignInFlowProps {
  onRequestCode: (email: string) => Promise<RequestCodeResult>;
  onVerify: (email: string, code: string) => Promise<VerifyResult>;
  resendCooldownSeconds?: number;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInFlow({
  onRequestCode,
  onVerify,
  resendCooldownSeconds = 60,
}: SignInFlowProps) {
  const t = useTranslations('auth');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const requestCode = async () => {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL.test(normalized)) {
      setError(t('errors.invalidEmail'));
      return;
    }
    setPending(true);
    setError(undefined);
    const result = await onRequestCode(normalized);
    setPending(false);
    if (result === 'sent') {
      setEmail(normalized);
      setCode('');
      setStep('code');
      setCooldown(resendCooldownSeconds);
      return;
    }
    setError(t(result === 'rate-limited' ? 'errors.rateLimited' : 'errors.invalidEmail'));
  };

  const verify = async (value: string) => {
    if (value.length !== 6 || pending) return;
    setPending(true);
    setError(undefined);
    const result = await onVerify(email, value);
    if (result === 'ok') return;
    setPending(false);
    setCode('');
    setError(t(result === 'too-many-attempts' ? 'errors.tooManyAttempts' : 'errors.invalidCode'));
  };

  if (step === 'email') {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void requestCode();
        }}
        noValidate
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-text">{t('signIn.title')}</h1>
          <p className="text-base text-text-muted">{t('signIn.subtitle')}</p>
        </div>
        <FormField label={t('signIn.emailLabel')} error={error}>
          <Input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            placeholder={t('signIn.emailPlaceholder')}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>
        <Button type="submit" size="lg" fullWidth loading={pending}>
          {t('signIn.submit')}
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void verify(code);
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text">{t('verify.title')}</h1>
        <p className="text-base text-text-muted">{t('verify.subtitle', { email })}</p>
      </div>
      <div className="flex flex-col gap-2">
        <OtpInput
          label={t('verify.codeLabel')}
          value={code}
          onChange={setCode}
          onComplete={(value) => void verify(value)}
          invalid={Boolean(error)}
          disabled={pending}
          focusOnMount
        />
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
      <Button type="submit" size="lg" fullWidth loading={pending} disabled={code.length !== 6}>
        {t('verify.submit')}
      </Button>
      <div className="flex items-center justify-between">
        <Button
          variant="link"
          onClick={() => {
            setStep('email');
            setError(undefined);
          }}
        >
          {t('verify.changeEmail')}
        </Button>
        <Button
          variant="link"
          disabled={cooldown > 0 || pending}
          onClick={() => void requestCode()}
        >
          {cooldown > 0 ? t('verify.resendIn', { seconds: cooldown }) : t('verify.resend')}
        </Button>
      </div>
    </form>
  );
}
