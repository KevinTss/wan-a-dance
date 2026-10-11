import { School } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { EmptyState, PageHeader, Stack } from '@wad/ui';
import { requireSession } from '@/server/auth';

export default async function HomePage() {
  const [{ user }, t] = await Promise.all([requireSession(), getTranslations('shell.home')]);
  return (
    <Stack gap={8}>
      <PageHeader
        title={t('greeting', { name: user.name || user.email })}
        description={t('subtitle')}
      />
      <EmptyState icon={<School />} title={t('emptyTitle')} description={t('emptyDescription')} />
    </Stack>
  );
}
