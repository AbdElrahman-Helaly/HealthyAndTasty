import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loyaltyApi, type DailyClaim } from '@/api/loyalty.api';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import type { UserManagement } from '@/types';
import { CustomerSelector, LoyaltyMetrics, LoyaltyResult } from './LoyaltyComponents';
import { loyaltyTimestamp } from './loyaltyFormat';
import { useLoyaltyQuery } from './useLoyaltyQuery';

export function LoyaltyReportsPanel({ customers, revision }: {
  customers: ReturnType<typeof useLoyaltyQuery<UserManagement[]>>;
  revision: number;
}) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [customerId, setCustomerId] = useState('');
  const statistics = useLoyaltyQuery(loyaltyApi.statistics, revision);
  const getClaims = useCallback(() => loyaltyApi.dailyClaims(customerId, page), [customerId, page]);
  const claims = useLoyaltyQuery(getClaims);
  const number = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 0 });
  const columns: Column<DailyClaim>[] = [
    { key: 'customerId', header: t('loyalty.customerId'), render: (row) => row.customerId },
    { key: 'claimDate', header: t('loyalty.claimDate'), render: (row) => <time dateTime={row.claimDate}>{row.claimDate}</time> },
    { key: 'streakDay', header: t('loyalty.streakDay'), render: (row) => number.format(row.streakDay) },
    { key: 'rewardPoints', header: t('loyalty.rewardPoints'), render: (row) => number.format(row.rewardPoints) },
    { key: 'loyaltyTransactionId', header: t('loyalty.loyaltyTransactionId'), render: (row) => row.loyaltyTransactionId ?? '—' },
    { key: 'createdAt', header: t('loyalty.createdAt'), render: (row) => loyaltyTimestamp(row.createdAt, i18n.language), className: 'whitespace-nowrap' },
  ];

  function filter(id: string) {
    setCustomerId(id);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <CardTitle>{t('loyalty.statistics')}</CardTitle>
      <LoyaltyResult query={statistics}>
        {(stats) => stats ? (
          <LoyaltyMetrics metrics={[
            { label: t('loyalty.walletCount'), value: stats.wallets },
            { label: t('loyalty.availablePoints'), value: stats.availablePoints },
            { label: t('loyalty.totalEarnedPoints'), value: stats.totalEarned },
            { label: t('loyalty.totalRedeemedPoints'), value: stats.totalRedeemed },
            { label: t('loyalty.claims'), value: stats.claims },
          ]} />
        ) : <Card>{t('loyalty.noStatistics')}</Card>}
      </LoyaltyResult>
      <Card padding="none">
        <div className="space-y-3 p-4">
          <CardTitle>{t('loyalty.claims')}</CardTitle>
          <LoyaltyResult query={customers}>
            {(items) => <CustomerSelector customers={items} customerId={customerId} onChange={filter} optional />}
          </LoyaltyResult>
        </div>
        <LoyaltyResult query={claims}>
          {(result) => (
            <>
              <DataTable
                columns={columns}
                data={result.items}
                keyExtractor={(row) => `${row.customerId}-${row.claimDate}`}
                emptyMessage={t('loyalty.noClaims')}
              />
              <div className="px-4 pb-4">
                <Pagination currentPage={result.page} totalPages={Math.ceil(result.totalCount / result.pageSize)} onPageChange={setPage} />
              </div>
            </>
          )}
        </LoyaltyResult>
      </Card>
    </div>
  );
}
