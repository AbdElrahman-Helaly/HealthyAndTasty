import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { SearchFilters } from '@/components/shared/SearchFilters';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { useCountries } from '@/hooks/useCountries';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Country } from '@/types';

export function CountriesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: countries, isLoading } = useCountries();
  const [search, setSearch] = useState('');
  usePageTitle(t('countries.title'));

  const filtered = useMemo(() => {
    if (!countries) return [];
    const q = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.nameAr.includes(q),
    );
  }, [countries, search]);

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (row: Country) => (
        <span className="font-mono font-medium text-primary">{row.code}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row: Country) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-on-surface-variant">{row.nameAr}</p>
        </div>
      ),
    },
    {
      key: 'branches',
      header: t('countries.branches'),
      render: (row: Country) => row.branchCount ?? '—',
    },
    {
      key: 'employees',
      header: t('countries.employees'),
      render: (row: Country) => row.employeeCount ?? '—',
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row: Country) => <StatusBadge active={row.isActive} />,
    },
  ];

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader title={t('countries.title')} subtitle={t('countries.subtitle')} />
      <Card>
        <SearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('common.search')}
        />
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => navigate(`/countries/${row.id}`)}
        />
      </Card>
    </div>
  );
}
