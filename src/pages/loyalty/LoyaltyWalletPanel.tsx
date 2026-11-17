import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loyaltyApi, type LoyaltyTransaction } from '@/api/loyalty.api';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import type { UserManagement } from '@/types';
import { CustomerSelector, LoyaltyError, LoyaltyMetrics, LoyaltyResult } from './LoyaltyComponents';
import { loyaltyMoney, loyaltyTimestamp } from './loyaltyFormat';
import { useLoyaltyQuery } from './useLoyaltyQuery';
import { WalletAdjustmentDialog } from './WalletAdjustmentDialog';

function CustomerWallet({ customer, canAdjust, onAdjusted, requests }: {
  customer: UserManagement;
  canAdjust: boolean;
  onAdjusted: () => void;
  requests: Map<string, string>;
}) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [adjusting, setAdjusting] = useState(false);
  const [denied, setDenied] = useState<{ cause: unknown }>();
  const customerId = String(customer.id);
  const getWallet = useCallback(() => loyaltyApi.wallet(customerId), [customerId]);
  const getTransactions = useCallback(() => loyaltyApi.transactions(customerId, page), [customerId, page]);
  const walletQuery = useLoyaltyQuery(getWallet, revision);
  const transactionsQuery = useLoyaltyQuery(getTransactions, revision);
  const number = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 0 });
  const signed = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 0, signDisplay: 'exceptZero' });
  const date = (value: string | null) => loyaltyTimestamp(value, i18n.language);
  const money = (value: number | null) => loyaltyMoney(value, i18n.language);
  const columns: Column<LoyaltyTransaction>[] = [
    { key: 'createdAt', header: t('loyalty.createdAt'), render: (row) => date(row.createdAt), className: 'whitespace-nowrap' },
    { key: 'type', header: t('loyalty.type'), render: (row) => row.type },
    {
      key: 'points',
      header: t('loyalty.points'),
      render: ({ points }) => (
        <Badge variant={points > 0 ? 'success' : points < 0 ? 'error' : 'neutral'} className="whitespace-nowrap">
          {t(points > 0 ? 'loyalty.credit' : points < 0 ? 'loyalty.debit' : 'loyalty.zeroPoints')} · {signed.format(points)}
        </Badge>
      ),
    },
    { key: 'monetaryEquivalent', header: t('loyalty.monetaryEquivalent'), render: (row) => money(row.monetaryEquivalent), className: 'whitespace-nowrap' },
    { key: 'status', header: t('common.status'), render: (row) => row.status },
    { key: 'description', header: t('loyalty.description'), render: (row) => row.description || '—' },
    { key: 'referenceType', header: t('loyalty.referenceType'), render: (row) => row.referenceType || '—' },
    { key: 'referenceId', header: t('loyalty.referenceId'), render: (row) => row.referenceId ?? '—' },
    { key: 'expiresAt', header: t('loyalty.expiresAt'), render: (row) => date(row.expiresAt), className: 'whitespace-nowrap' },
  ];

  function refresh() {
    setAdjusting(false);
    setPage(1);
    setRevision((previous) => previous + 1);
    onAdjusted();
  }

  return (
    <div className="space-y-4">
      <LoyaltyResult query={walletQuery}>
        {(wallet) => wallet ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>{t('loyalty.walletBalance')}</CardTitle>
              {canAdjust && !denied && <Button size="sm" onClick={() => setAdjusting(true)}>{t('loyalty.adjustWallet')}</Button>}
            </div>
            {denied && <LoyaltyError error={denied.cause} />}
            {wallet.debtPoints > 0 && (
              <p role="status" className="rounded-xl border border-error/30 bg-error/10 p-3 text-sm font-semibold text-error">
                {t('loyalty.debtAlert', { points: number.format(wallet.debtPoints) })}
              </p>
            )}
            <LoyaltyMetrics metrics={[
              { label: t('loyalty.availablePoints'), value: wallet.availablePoints },
              { label: t('loyalty.reservedPoints'), value: wallet.pendingPoints },
              { label: t('loyalty.totalEarnedPoints'), value: wallet.totalEarnedPoints },
              { label: t('loyalty.totalRedeemedPoints'), value: wallet.totalRedeemedPoints },
              { label: t('loyalty.debtPoints'), value: wallet.debtPoints, alert: wallet.debtPoints > 0 },
              { label: t('loyalty.monetaryEquivalent'), value: money(wallet.monetaryEquivalent) },
              { label: t('loyalty.currency'), value: wallet.currency },
            ]} />
          </>
        ) : <Card>{t('loyalty.noWallet')}</Card>}
      </LoyaltyResult>
      <Card padding="none">
        <CardTitle className="p-4">{t('loyalty.transactions')}</CardTitle>
        <LoyaltyResult query={transactionsQuery}>
          {(result) => (
            <>
              <DataTable
                columns={columns}
                data={result.items}
                keyExtractor={(row) => row.id == null ? '' : String(row.id)}
                emptyMessage={t('loyalty.noTransactions')}
              />
              <div className="px-4 pb-4">
                <Pagination currentPage={result.page} totalPages={Math.ceil(result.totalCount / result.pageSize)} onPageChange={setPage} />
              </div>
            </>
          )}
        </LoyaltyResult>
      </Card>
      {adjusting && canAdjust && (
        <WalletAdjustmentDialog
          customer={customer}
          requests={requests}
          onClose={() => setAdjusting(false)}
          onSaved={refresh}
          onForbidden={(cause) => setDenied({ cause })}
        />
      )}
    </div>
  );
}

export function LoyaltyWalletPanel({ customers, canAdjust, onAdjusted }: {
  customers: UserManagement[];
  canAdjust: boolean;
  onAdjusted: () => void;
}) {
  const { t } = useTranslation();
  const [customerId, setCustomerId] = useState('');
  const [requests] = useState(() => new Map<string, string>());
  const customer = customers.find((entry) => String(entry.id) === customerId);
  return (
    <div className="space-y-4">
      <Card>
        <CustomerSelector customers={customers} customerId={customerId} onChange={setCustomerId} />
      </Card>
      {customer
        ? <CustomerWallet key={customer.id} customer={customer} canAdjust={canAdjust} onAdjusted={onAdjusted} requests={requests} />
        : <Card>{t(customers.length ? 'loyalty.chooseWalletCustomer' : 'loyalty.noCustomers')}</Card>}
    </div>
  );
}
