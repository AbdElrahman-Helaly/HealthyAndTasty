import { useTranslation } from 'react-i18next';
import { ShieldX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePageTitle } from '@/hooks/usePageTitle';

export function UnauthorizedPage() {
  const { t } = useTranslation();
  usePageTitle(t('unauthorized.title'));

  return (
    <div>
      <PageHeader title={t('unauthorized.title')} subtitle={t('unauthorized.subtitle')} />
      <Card padding="xl">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10 text-error">
            <ShieldX className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-on-surface">{t('unauthorized.heading')}</h2>
          <p className="mt-1 max-w-md text-sm text-on-surface-variant">
            {t('unauthorized.message')}
          </p>
          <Link to="/dashboard" className="mt-6">
            <Button>{t('unauthorized.backHome')}</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
