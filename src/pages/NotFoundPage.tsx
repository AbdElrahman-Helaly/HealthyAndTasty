import { useTranslation } from 'react-i18next';
import { FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePageTitle } from '@/hooks/usePageTitle';

export function NotFoundPage() {
  const { t } = useTranslation();
  usePageTitle(t('notFound.title'));

  return (
    <div>
      <PageHeader title={t('notFound.title')} subtitle={t('notFound.subtitle')} />
      <Card padding="xl">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-surface text-primary">
            <FileQuestion className="h-8 w-8" />
          </div>
          <p className="mt-4 text-5xl font-bold text-on-surface">404</p>
          <h2 className="mt-2 text-lg font-bold text-on-surface">{t('notFound.heading')}</h2>
          <p className="mt-1 max-w-md text-sm text-on-surface-variant">{t('notFound.message')}</p>
          <Link to="/dashboard" className="mt-6">
            <Button>{t('notFound.backHome')}</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
