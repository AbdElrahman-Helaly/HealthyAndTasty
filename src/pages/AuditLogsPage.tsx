import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { SearchFilters } from '@/components/shared/SearchFilters';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatDate } from '@/lib/utils';
import type { AuditLog } from '@/types';

export function AuditLogsPage() {
  const { t } = useTranslation();
  const { data: logs, isLoading } = useAuditLogs();
  const [search, setSearch] = useState('');
  usePageTitle(t('audit.title'));

  const filtered = useMemo(() => {
    if (!logs) return [];
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.actor.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.entity.toLowerCase().includes(q),
    );
  }, [logs, search]);

  const actionVariant = (action: string) => {
    if (action === 'DELETE') return 'error' as const;
    if (action === 'CREATE') return 'success' as const;
    if (action === 'LOGIN') return 'info' as const;
    return 'default' as const;
  };

  const columns = [
    { key: 'time', header: t('audit.timestamp'), render: (row: AuditLog) => formatDate(row.timestamp) },
    { key: 'actor', header: t('audit.actor'), render: (row: AuditLog) => row.actor },
    { key: 'action', header: t('audit.action'), render: (row: AuditLog) => (
      <Badge variant={actionVariant(row.action)}>{row.action}</Badge>
    )},
    { key: 'entity', header: t('audit.entity'), render: (row: AuditLog) => `${row.entity} (${row.entityId})` },
    { key: 'ip', header: t('audit.ipAddress'), render: (row: AuditLog) => (
      <span className="font-mono text-xs">{row.ipAddress}</span>
    )},
  ];

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader title={t('audit.title')} subtitle={t('audit.subtitle')} />
      <Card>
        <SearchFilters searchValue={search} onSearchChange={setSearch} searchPlaceholder={t('common.search')} />
        <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.id} />
      </Card>
    </div>
  );
}
