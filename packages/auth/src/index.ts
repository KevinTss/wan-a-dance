import { betterAuth, type BetterAuthPlugin } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { randomUUID } from 'node:crypto';
import { apiKey } from '@better-auth/api-key';
import { generateId, ID_PREFIXES, type IdPrefix } from '@wad/core';
import type { PrismaClient } from '@wad/db';
import { createMailer, sendOtpEmail, type Mailer } from '@wad/email';
import { LOCALE_COOKIE, resolveLocale } from '@wad/i18n';

export const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 600;
export const OTP_MAX_ATTEMPTS = 5;
export const API_KEY_PREFIX = 'wad_';

const MODEL_PREFIX: Record<string, IdPrefix> = {
  user: ID_PREFIXES.USER,
  session: ID_PREFIXES.SESSION,
  account: ID_PREFIXES.ACCOUNT,
  verification: ID_PREFIXES.VERIFICATION,
  apikey: ID_PREFIXES.API_KEY,
};

function localeFromHeaders(headers: Headers | undefined) {
  const cookie = headers
    ?.get('cookie')
    ?.split(';')
    .map((part) => part.trim().split('='))
    .find(([name]) => name === LOCALE_COOKIE)?.[1];
  return resolveLocale([cookie, headers?.get('accept-language')]);
}

export interface CreateAuthOptions {
  db: PrismaClient;
  secret: string;
  baseURL: string;
  mailer?: Mailer;
  plugins?: BetterAuthPlugin[];
  trustedOrigins?: string[];
  rateLimitEnabled?: boolean;
}

function lazyMailer(provided: Mailer | undefined): Mailer {
  let resolved = provided;
  return {
    send(email) {
      resolved ??= createMailer();
      return resolved.send(email);
    },
  };
}

export function createAuth({
  db,
  secret,
  baseURL,
  mailer,
  plugins = [],
  trustedOrigins = [],
  rateLimitEnabled = true,
}: CreateAuthOptions) {
  const outbox = lazyMailer(mailer);
  return betterAuth({
    appName: 'Wan a Dance',
    secret,
    baseURL,
    trustedOrigins: [baseURL, ...trustedOrigins],
    database: prismaAdapter(db, { provider: 'postgresql' }),
    user: {
      modelName: 'user',
      additionalFields: { locale: { type: 'string', required: false, input: true } },
    },
    session: {
      modelName: 'authSession',
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    account: { modelName: 'authAccount' },
    verification: { modelName: 'authVerification' },
    emailAndPassword: { enabled: false },
    rateLimit: {
      enabled: rateLimitEnabled,
      storage: 'database',
      modelName: 'authRateLimit',
      window: 60,
      max: 100,
    },
    advanced: {
      cookiePrefix: 'wad',
      useSecureCookies: baseURL.startsWith('https://'),
      database: {
        generateId: ({ model }) => {
          const prefix = MODEL_PREFIX[model];
          return prefix ? generateId(prefix) : randomUUID();
        },
      },
    },
    plugins: [
      emailOTP({
        otpLength: OTP_LENGTH,
        expiresIn: OTP_TTL_SECONDS,
        allowedAttempts: OTP_MAX_ATTEMPTS,
        storeOTP: 'hashed',
        overrideDefaultEmailVerification: true,
        rateLimit: { window: 60, max: 3 },
        async sendVerificationOTP({ email, otp }, ctx) {
          await sendOtpEmail(outbox, {
            to: email,
            code: otp,
            locale: localeFromHeaders(ctx?.request?.headers ?? ctx?.headers),
            minutes: OTP_TTL_SECONDS / 60,
          });
        },
      }),
      apiKey({
        defaultPrefix: API_KEY_PREFIX,
        defaultKeyLength: 48,
        enableMetadata: true,
        schema: { apikey: { modelName: 'apiKey' } },
        rateLimit: { enabled: true, timeWindow: 60_000, maxRequests: 120 },
        keyExpiration: { defaultExpiresIn: null, minExpiresIn: 1, maxExpiresIn: 365 },
      }),
      ...plugins,
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth['$Infer']['Session'];
