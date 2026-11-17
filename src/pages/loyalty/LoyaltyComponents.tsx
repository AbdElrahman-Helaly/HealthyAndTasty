import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Spinner } from '@/components/ui/Spinner';
import type { UserManagement } from '@/types';
import { customerLabel } from './loyaltyFormat';
import { errorMessages, isForbidden, type useLoyaltyQuery } from './useLoyaltyQuery';

export function LoyaltyError({ error, retry }: { error: unknown; retry?: () => void }) {
  const { t } = useTranslation();
  const forbidden = isForbidden(error);

  return (
    <div role="alert" className="space-y-2 rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error">
      {forbidden && <p className="font-semibold">{t('loyalty.permissionDenied')}</p>}
      {errorMessages(error, t('loyalty.requestFailed')).map((message) => <p key={message}>{message}</p>)}
      {retry && !forbidden && <Button size="sm" variant="secondary" onClick={retry}>{t('loyalty.retry')}</Button>}
    </div>
  );
}

export function LoyaltyResult<T>({
  query,
  children,
}: {
  query: ReturnType<typeof useLoyaltyQuery<T>>;
  children: (data: T) => ReactNode;
}) {
  const { t } = useTranslation();
  if (!query.result) {
    return (
      <div role="status" className="flex items-center justify-center py-8">
        <Spinner />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }
  if ('error' in query.result) return <LoyaltyError error={query.result.error} retry={query.retry} />;
  return children(query.result.data);
}

export function CustomerSelector({ customers, customerId, onChange, optional }: {
  customers: UserManagement[];
  customerId: string;
  onChange: (id: string) => void;
  optional?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-full sm:max-w-sm">
        <MultiSelect
          label={t('loyalty.customer')}
          options={customers.map((customer) => ({ label: customerLabel(customer), value: String(customer.id) }))}
          value={customerId ? [customerId] : []}
          onChange={([id]) => onChange(id ?? '')}
          single
          searchable
          disabled={customers.length === 0}
          placeholder={t(optional ? 'loyalty.allCustomers' : 'loyalty.selectCustomer')}
          searchPlaceholder={t('loyalty.searchCustomers')}
          noResultsText={t('loyalty.noCustomers')}
        />
      </div>
      {optional && customerId && (
        <Button variant="secondary" size="sm" onClick={() => onChange('')}>{t('loyalty.allCustomers')}</Button>
      )}
    </div>
  );
}

export function LoyaltyMetrics({ metrics }: {
  metrics: { label: string; value: string | number; alert?: boolean }[];
}) {
  const { i18n } = useTranslation();
  const format = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 0 });
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {metrics.map(({ label, value, alert }) => (
        <Card key={label} className={alert ? 'border border-error/40 bg-error/10 text-error' : undefined}>
          <dt className="text-sm font-medium">{label}</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {typeof value === 'number' ? format.format(value) : value}
          </dd>
        </Card>
      ))}
    </dl>
  );
}
