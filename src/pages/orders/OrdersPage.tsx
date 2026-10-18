import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { listOrders } from '@/api/orders.api';
import { orderStatusConfig, formatCurrency } from '@/config/orderStatus';
import { ORDER_STATUS, type DashboardOrderListItem, type OrderListParams, type OrderStatusNumber } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';
import { BRANCH_ORDER_CREATED } from '@/components/layout/BranchOrderNotifications';

const PAGE_SIZE = 12;

  const statusOptions: { value: string; label: string }[] = [
    { value: '', label: 'كل الحالات' },
    ...Object.entries(ORDER_STATUS).map(([, num]) => ({
      value: String(num),
      label: orderStatusConfig(num as OrderStatusNumber).label,
    })),
  ];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rows, setRows] = useState<DashboardOrderListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderListParams['status']>(undefined);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');
  usePageTitle(t('orders.title'));

  const load = useCallback(async (p: number, opts: Pick<OrderListParams, 'status' | 'search' | 'from' | 'to'>) => {
    setError('');
    try {
      const res = await listOrders({
        page: p,
        pageSize: PAGE_SIZE,
        status: opts.status,
        search: opts.search || undefined,
        from: opts.from || undefined,
        to: opts.to || undefined,
      });
      setRows(res.items);
      setTotalPages(Math.max(1, res.totalPages));
      setPage(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الطلبات');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load(1, { status, search, from, to });
    }, 300);
    return () => clearTimeout(timer);
  }, [status, search, from, to, load]);

  useEffect(() => {
    const refresh = () => { void load(1, { status, search, from, to }); };
    window.addEventListener(BRANCH_ORDER_CREATED, refresh);
    return () => window.removeEventListener(BRANCH_ORDER_CREATED, refresh);
  }, [load, status, search, from, to]);

  const columns = useMemo<Column<DashboardOrderListItem>[]>(
    () => [
      {
        key: 'orderNumber',
        header: 'رقم الطلب',
        render: (o) => (
          <div>
            <p className="font-semibold text-on-surface">{o.orderNumber}</p>
            <p className="text-[11px] text-on-surface-variant/60">#{o.odooOrderId}</p>
          </div>
        ),
      },
      {
        key: 'customer',
        header: 'العميل',
        render: (o) => (
          <div>
            <p className="font-medium text-on-surface">{o.customerName}</p>
            <p className="text-[11px] text-on-surface-variant/60" dir="ltr">{o.customerPhone}</p>
          </div>
        ),
      },
      {
        key: 'branch',
        header: 'الفرع',
        render: (o) => <span className="text-on-surface-variant/80">{o.branchName}</span>,
      },
      {
        key: 'total',
        header: 'المبلغ',
        render: (o) => <span className="font-semibold text-on-surface">{formatCurrency(o.total)}</span>,
      },
      {
        key: 'items',
        header: 'المنتجات',
        render: (o) => <span className="text-on-surface-variant/70">{o.itemsCount}</span>,
      },
      {
        key: 'status',
        header: 'الحالة',
        render: (o) => <span className={orderStatusConfig(o.statusNumber).className}>{orderStatusConfig(o.statusNumber).label}</span>,
      },
      {
        key: 'createdAt',
        header: 'التاريخ',
        render: (o) => <span className="text-xs text-on-surface-variant/60">{formatDate(o.createdAt)}</span>,
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title={t('orders.title')}
        subtitle={t('orders.subtitle')}
        actions={
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => void load(1, { status, search, from, to })}>
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        }
      />

      {/* Filters */}
      <Card padding="md" className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            label="بحث"
            placeholder="رقم الطلب أو اسم العميل أو الهاتف"
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select label="الحالة" value={status === undefined ? '' : String(status)} onChange={(e) => setStatus(e.target.value ? Number(e.target.value) as OrderStatusNumber : undefined)}>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
          <Input label="من تاريخ" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="إلى تاريخ" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </Card>

      <Card padding="none">
        {error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-on-surface-variant">{error}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => void load(page, { status, search, from, to })}>
              إعادة المحاولة
            </Button>
          </div>
        )}
        {!error && (
          <>
            <DataTable
              columns={columns}
              data={rows}
              keyExtractor={(o) => String(o.id)}
              onRowClick={(o) => navigate(`/orders/${o.id}`)}
              emptyMessage="لا توجد طلبات مطابقة"
            />
            <div className="px-4 pb-4">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => void load(p, { status, search, from, to })} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
