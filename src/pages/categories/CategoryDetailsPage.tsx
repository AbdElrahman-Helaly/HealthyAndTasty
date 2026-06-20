import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DetailLayout } from '@/components/shared/DetailLayout';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { useCategory } from '@/hooks/useCategories';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatDate } from '@/lib/utils';

export function CategoryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: category, isLoading } = useCategory(id);
  usePageTitle(category?.name ?? t('categories.title'));

  if (isLoading) return <PageLoader />;
  if (!category) return <p className="text-on-surface-variant">Category not found.</p>;

  return (
    <DetailLayout
      title={category.name}
      subtitle={category.nameAr}
      backHref="/categories"
      backLabel={t('common.back')}
      sections={[
        {
          id: 'info',
          label: t('categories.title'),
          content: (
            <Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-on-surface-variant">{t('common.status')}</p>
                  <div className="mt-1"><StatusBadge active={category.isActive} /></div>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Products</p>
                  <p className="mt-1 font-medium">{category.productCount}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Created</p>
                  <p className="mt-1 font-medium">{formatDate(category.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Updated</p>
                  <p className="mt-1 font-medium">{formatDate(category.updatedAt)}</p>
                </div>
              </div>
            </Card>
          ),
        },
      ]}
    />
  );
}
