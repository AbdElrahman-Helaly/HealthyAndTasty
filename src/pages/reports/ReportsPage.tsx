import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3, FileText, CalendarRange, TrendingUp, ReceiptText, Wallet, RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { getSalesReport, getAuditLogs } from '@/api/reports.api';
import type { AuditLog, SalesReport } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';
import { cn } from '@/lib/utils';

const C = { primary: '#6D4CFF', green: '#22C55E', blue: '#3B82F6', orange: '#F59E0B', red: '#EF4444', purple: '#8B5CF6' };

const AUDIT_PAGE_SIZE = 15;

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
  return n.toLocaleString();
}

function DailyRevenueChart({ daily }: { daily: SalesReport['daily'] }) {
  if (!daily.length) return <div className="flex items-center justify-center h-48 text-sm text-on-surface-variant/60">لا توجد بيانات للفترة المحددة</div>;
  const w = 600; const h = 240; const px = 50; const py = 25;
  const iw = w - px * 2; const ih = h - py * 2;
  const max = Math.max(...daily.map((d) => d.revenue));
  const rng = max || 1;
  const barW = iw / daily.length;
  const labelStep = Math.max(1, Math.floor(daily.length / 8));
  const maxIdx = daily.reduce((mi, d, i) => (d.revenue > daily[mi].revenue ? i : mi), 0);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {[0.75, 0.5, 0.25].map((f) => {
        const y = py + ih - f * ih;
        return (
          <g key={f}>
            <line x1={px} y1={y} x2={w - px} y2={y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
            <text x={px - 10} y={y + 4} textAnchor="end" className="text-[10px]" fill="#94A3B8">{fmt(Math.round(max * f))}</text>
          </g>
        );
      })}
      {daily.map((d, i) => {
        const x = px + i * barW;
        const barH = (d.revenue / rng) * ih;
        const y = py + ih - barH;
        const isMax = i === maxIdx;
        return (
          <g key={d.date}>
            <rect
              x={x + barW * 0.15}
              y={y}
              width={barW * 0.7}
              height={barH}
              rx="4"
              fill={isMax ? C.primary : `${C.primary}66`}
            />
            {isMax && <rect x={x + barW * 0.15} y={y - 2} width={barW * 0.7} height="2" rx="1" fill={C.primary} />}
          </g>
        );
      })}
      {daily.map((d, i) => {
        if (i % labelStep !== 0) return null;
        const x = px + i * barW + barW / 2;
        return <text key={d.date} x={x} y={h - 6} textAnchor="middle" className="text-[10px]" fill="#94A3B8">{d.date.slice(5)}</text>;
      })}
    </svg>
  );
}

export function ReportsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'sales' | 'audit'>('sales');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [sales, setSales] = useState<SalesReport | null>(null);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState('');

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState('');

  usePageTitle(t('reports.title'));

  const loadSales = useCallback(async (f: string, tt: string) => {
    setSalesLoading(true);
    setSalesError('');
    try {
      setSales(await getSalesReport(f || undefined, tt || undefined));
    } catch (err) {
      setSalesError(err instanceof Error ? err.message : 'فشل تحميل التقرير');
    } finally {
      setSalesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSales(from, to);
  }, [loadSales, from, to]);

  const loadAudit = useCallback(async (p: number) => {
    setLogLoading(true);
    setLogError('');
    try {
      const res = await getAuditLogs({
        page: p,
        pageSize: AUDIT_PAGE_SIZE,
        from: from || undefined,
        to: to || undefined,
      });
      setLogs(res.items);
      setLogTotalPages(Math.max(1, res.totalPages));
      setLogPage(p);
    } catch (err) {
      setLogError(err instanceof Error ? err.message : 'فشل تحميل سجل التدقيق');
    } finally {
      setLogLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    if (tab === 'audit') void loadAudit(1);
  }, [tab, loadAudit]);

  const logColumns: Column<AuditLog>[] = [
    {
      key: 'action',
      header: 'الإجراء',
      render: (l) => (
        <span className="rounded-full bg-primary-surface px-2.5 py-1 text-xs font-semibold text-primary">{l.action}</span>
      ),
    },
    { key: 'entity', header: 'الكيان', render: (l) => <span className="text-on-surface-variant/80">{l.entity}</span> },
    { key: 'entityId', header: 'المعرف', render: (l) => <span className="font-mono text-xs text-on-surface-variant/70" dir="ltr">{l.entityId ?? '—'}</span> },
    { key: 'user', header: 'المستخدم', render: (l) => <span>{l.userName ?? '—'}</span> },
    { key: 'device', header: 'الجهاز', render: (l) => <span className="text-on-surface-variant/70">{l.device ?? '—'}</span> },
    {
      key: 'createdAt',
      header: 'التاريخ',
      render: (l) => (
        <span className="text-xs text-on-surface-variant/60">
          {new Date(l.createdAt).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={tab === 'sales' ? 'primary' : 'secondary'}
              size="sm"
              className={cn('gap-1.5', tab !== 'sales' && '!bg-white')}
              onClick={() => setTab('sales')}
            >
              <BarChart3 className="h-4 w-4" />
              تقرير المبيعات
            </Button>
            <Button
              variant={tab === 'audit' ? 'primary' : 'secondary'}
              size="sm"
              className={cn('gap-1.5', tab !== 'audit' && '!bg-white')}
              onClick={() => setTab('audit')}
            >
              <FileText className="h-4 w-4" />
              سجل التدقيق
            </Button>
          </div>
        }
      />

      {/* Date filters */}
      <Card padding="md" className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <Input label="من تاريخ" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="إلى تاريخ" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="flex items-center gap-2 text-sm text-on-surface-variant/60">
            <CalendarRange className="h-4 w-4" />
            الفلاتر تنطبق على كلا التقريرين
          </div>
        </div>
      </Card>

      {tab === 'sales' && (
        <div className="flex flex-col gap-4">
          {salesLoading ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
              </div>
              <div className="h-72 skeleton rounded-2xl" />
            </div>
          ) : salesError ? (
            <Card padding="xl">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-base font-medium text-on-surface-variant">{salesError}</p>
                <Button variant="secondary" className="mt-4 gap-1.5" onClick={() => void loadSales(from, to)}>
                  <RefreshCw className="h-4 w-4" />
                  إعادة المحاولة
                </Button>
              </div>
            </Card>
          ) : sales ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  label="إجمالي الطلبات"
                  value={sales.totalOrders.toLocaleString()}
                  icon={<ReceiptText className="h-5 w-5" />}
                  iconColor={C.blue}
                  comparisonText={`${sales.daily.length} يوم`}
                  index={0}
                />
                <StatCard
                  label="إجمالي الإيرادات"
                  value={`${fmt(sales.totalRevenue)} ج.م`}
                  icon={<Wallet className="h-5 w-5" />}
                  iconColor={C.green}
                  index={1}
                />
                <StatCard
                  label="متوسط قيمة الطلب"
                  value={`${fmt(sales.averageOrderValue)} ج.م`}
                  icon={<TrendingUp className="h-5 w-5" />}
                  iconColor={C.primary}
                  index={2}
                />
              </div>

              <Card padding="xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[15px] font-semibold text-on-surface tracking-tight">الإيرادات اليومية</h3>
                    <p className="text-xs text-on-surface-variant/70 mt-0.5">{sales.from} ← {sales.to}</p>
                  </div>
                </div>
                <DailyRevenueChart daily={sales.daily} />
              </Card>

              <Card padding="xl">
                <h3 className="text-[15px] font-semibold text-on-surface tracking-tight mb-4">الإيرادات حسب الفرع</h3>
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-start py-3 px-3 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">الفرع</th>
                        <th className="text-start py-3 px-3 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">عدد الطلبات</th>
                        <th className="text-start py-3 px-3 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">الإيرادات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.byBranch.map((b) => (
                        <tr key={b.branchId} className="border-b border-gray-50 hover:bg-primary-surface/30 transition-colors">
                          <td className="py-3.5 px-3 font-medium text-on-surface">{b.branchName}</td>
                          <td className="py-3.5 px-3 text-on-surface-variant/70">{b.ordersCount}</td>
                          <td className="py-3.5 px-3 font-semibold text-on-surface">{fmt(b.revenue)} ج.م</td>
                        </tr>
                      ))}
                      {sales.byBranch.length === 0 && (
                        <tr><td colSpan={3} className="py-8 text-center text-sm text-on-surface-variant/60">لا توجد بيانات</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {tab === 'audit' && (
        <Card padding="none">
          {logLoading && (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 skeleton rounded-xl" />)}
            </div>
          )}
          {!logLoading && logError && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-on-surface-variant">{logError}</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => void loadAudit(1)}>
                إعادة المحاولة
              </Button>
            </div>
          )}
          {!logLoading && !logError && (
            <>
              <DataTable
                columns={logColumns}
                data={logs}
                keyExtractor={(l) => String(l.id)}
                emptyMessage="لا توجد سجلات"
              />
              <div className="px-4 pb-4">
                <Pagination currentPage={logPage} totalPages={logTotalPages} onPageChange={(p) => void loadAudit(p)} />
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
