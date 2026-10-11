import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import pkg from './package.json' with { type: 'json' };

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const config: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  transpilePackages: [
    '@wad/ui',
    '@wad/core',
    '@wad/auth',
    '@wad/api',
    '@wad/db',
    '@wad/email',
    '@wad/i18n',
  ],
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_COMMIT_SHA: (process.env['VERCEL_GIT_COMMIT_SHA'] ?? 'local').slice(0, 7),
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default withNextIntl(config);
