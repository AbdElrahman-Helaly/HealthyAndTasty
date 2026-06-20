import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Users, Package, Upload } from 'lucide-react';
import { DetailLayout } from '@/components/shared/DetailLayout';
import { Card, StatCard } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { useCountry } from '@/hooks/useCountries';
import { usePageTitle } from '@/hooks/usePageTitle';

export function CountryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: country, isLoading } = useCountry(id);
  usePageTitle(country?.name ?? t('countries.details'));

  if (isLoading) return <PageLoader />;
  if (!country) return <p className="text-on-surface-variant">Country not found.</p>;

  return (
    <DetailLayout
      title={country.name}
      subtitle={`${country.code} · ${country.nameAr}`}
      backHref="/countries"
      backLabel={t('common.back')}
      sections={[
        {
          id: 'info',
          label: t('countries.details'),
          content: (
            <Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-on-surface-variant">{t('common.status')}</p>
                  <div className="mt-1"><StatusBadge active={country.isActive} /></div>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">{t('countries.currency')}</p>
                  <p className="mt-1 font-medium">{country.currency}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">{t('countries.timezone')}</p>
                  <p className="mt-1 font-medium">{country.timezone}</p>
                </div>
              </div>
            </Card>
          ),
        },
        {
          id: 'stats',
          label: 'Statistics',
          content: (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <StatCard label={t('countries.branches')} value={country.stats.branchCount} icon={<Building2 className="h-5 w-5" />} />
              <StatCard label={t('countries.employees')} value={country.stats.employeeCount} icon={<Users className="h-5 w-5" />} iconBg="bg-accent/10 text-accent" />
              <StatCard label={t('countries.products')} value={country.stats.productCount} icon={<Package className="h-5 w-5" />} />
              <StatCard label={t('countries.importsThisMonth')} value={country.stats.importsThisMonth} icon={<Upload className="h-5 w-5" />} iconBg="bg-info/10 text-info" />
            </div>
          ),
        },
      ]}
    />
  );
}
