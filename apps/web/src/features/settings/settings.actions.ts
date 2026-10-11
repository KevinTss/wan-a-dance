'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { getDb } from '@wad/db/client';
import { LOCALE_COOKIE, LOCALES } from '@wad/i18n';
import { createAction } from '@/lib/action';

const ONE_YEAR = 60 * 60 * 24 * 365;

export const setLocale = createAction(
  z.object({ locale: z.enum(LOCALES) }),
  async (ctx, { locale }) => {
    await getDb().user.update({ where: { id: ctx.userId }, data: { locale } });
    (await cookies()).set(LOCALE_COOKIE, locale, { maxAge: ONE_YEAR, sameSite: 'lax', path: '/' });
    return { locale };
  },
);
