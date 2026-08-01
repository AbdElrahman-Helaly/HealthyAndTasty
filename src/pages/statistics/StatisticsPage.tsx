import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, DollarSign, ShoppingCart, Clock, CheckCircle2, XCircle, XOctagon, RefreshCw,
  Wallet, ReceiptText, Package,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getStatistics } from '@/api/statistics.api';
import { orderStatusConfig } from '@/config/orderStatus';
import type { DashboardStatistics } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';
import { motion } from 'framer-motion';

const C = { primary: '#6D4CFF', green: '#22C55E', blue: '#3B82F6', orange: '#F59E0B', red: '#EF4444', purple: '#8B5CF6' };

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
  return n.toLocaleString();
}

function OrdersDonut({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <div className="flex items-center justify-center h-36 text-sm text-on-surface-variant/60">لا توجد طلبات</div>;
  const r = 70; const cx = 100; const cy = 100; const circ = 2 * Math.PI * r;

  const segments = data.reduce(
    (acc, d) => {
      const pct = d.value / total;
      const offset = acc.offset;
      acc.items.push({ ...d, offset, len: pct * circ });
      acc.offset += pct;
      return acc;
    },
    { items: [] as { label: string; color: string; offset: number; len: number }[], offset: 0 },
  );

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 135" className="w-48 h-32">
        {segments.items.map(d => (
          <circle key={d.label} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth="20" strokeDasharray={`${d.len} ${circ - d.len}`} strokeDashoffset={-d.offset} transform="rotate(-90 100 100)" opacity="0.85" />
        ))}
        <circle cx={cx} cy={cy} r={r - 14} fill="white" />
        <text x={cx} y={cy - 5} textAnchor="middle" className="text-[24px] font-bold" fill="#0F172A">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="text-[10px]" fill="#64748B">إجمالي</text>
      </svg>
      <div className="flex flex-wrap justify-center gap-3 mt-3">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-[11px] text-on-surface-variant/80">{d.label} <strong className="text-on-surface">{d.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatisticsPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [appliedFrom, setAppliedFrom] = useState<string | undefined>(undefined);
  const [appliedTo, setAppliedTo] = useState<string | undefined>(undefined);
  const [data, setData] = useState<DashboardStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  usePageTitle(t('statistics.title'));

  const load = useCallback(async (f?: string, tt?: string) => {
    setIsLoading(true);
    setError('');
    try {
      setData(await getStatistics(f, tt));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الإحصائيات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(appliedFrom, appliedTo);
  }, [load, appliedFrom, appliedTo]);

  function applyFilter() {
    setAppliedFrom(from || undefined);
    setAppliedTo(to || undefined);
  }

  if (isLoading && !data) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 skeleton rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-72 skeleton rounded-2xl" />
          <div className="h-72 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div>
        <PageHeader title={t('statistics.title')} subtitle={t('statistics.subtitle')} />
        <Card padding="xl">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-base font-medium text-on-surface-variant">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={() => void load(appliedFrom, appliedTo)}>
              إعادة المحاولة
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const donutData = data.ordersByStatus
    .filter(s => s.count > 0)
    .map(s => ({ label: orderStatusConfig(s.statusNumber).label, value: s.count, color: orderStatusConfig(s.statusNumber).color }));

  const maxRev = Math.max(1, ...data.revenueByBranch.map(b => b.revenue));

  return (
    <div>
      <PageHeader
        title={t('statistics.title')}
        subtitle={t('statistics.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="!w-auto" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="!w-auto" />
            <Button size="sm" onClick={applyFilter} className="gap-1.5">
              <RefreshCw className="h-4 w-4" />
              تطبيق
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="الإيرادات الإجمالية" value={`${fmt(data.totalRevenue)} ر.س`} icon={<DollarSign className="h-5 w-5" />} iconColor={C.green} comparisonText="ر.س" index={0} />
          <StatCard label="إجمالي الطلبات" value={data.totalOrders.toLocaleString()} icon={<ShoppingCart className="h-5 w-5" />} iconColor={C.blue} comparisonText={`${data.todayOrders} اليوم`} index={1} />
          <StatCard label="إجمالي العملاء" value={data.totalCustomers.toLocaleString()} icon={<Users className="h-5 w-5" />} iconColor={C.primary} index={2} />
          <StatCard label="متوسط قيمة الطلب" value={`${fmt(data.averageOrderValue)} ر.س`} icon={<ReceiptText className="h-5 w-5" />} iconColor={C.orange} index={3} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="إيرادات اليوم" value={`${fmt(data.todayRevenue)} ر.س`} icon={<Wallet className="h-5 w-5" />} iconColor={C.purple} comparisonText="اليوم" index={0} />
          <StatCard label="قيد الانتظار" value={data.pendingOrders.toLocaleString()} icon={<Clock className="h-5 w-5" />} iconColor={C.orange} index={1} />
          <StatCard label="قيد التنفيذ" value={data.inProgressOrders.toLocaleString()} icon={<ShoppingCart className="h-5 w-5" />} iconColor={C.blue} index={2} />
          <StatCard label="تم التوصيل" value={data.deliveredOrders.toLocaleString()} icon={<CheckCircle2 className="h-5 w-5" />} iconColor={C.green} index={3} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="ملغي" value={data.cancelledOrders.toLocaleString()} icon={<XCircle className="h-5 w-5" />} iconColor={C.red} alert={data.cancelledOrders > 0} index={0} />
          <StatCard label="مرفوض" value={data.rejectedOrders.toLocaleString()} icon={<XOctagon className="h-5 w-5" />} iconColor="#F43F5E" alert={data.rejectedOrders > 0} index={1} />
          <StatCard label="فشل المزامنة" value={data.failedToSyncOrders.toLocaleString()} icon={<RefreshCw className="h-5 w-5" />} iconColor="#94A3B8" alert={data.failedToSyncOrders > 0} index={2} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Card padding="xl">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-surface text-primary">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-on-surface">الإيرادات حسب الفرع</h3>
                  <p className="text-[11px] text-on-surface-variant/60 mt-0.5">توزيع الإيرادات والطلبات</p>
                </div>
              </div>
              <div className="flex flex-col gap-5">
                {data.revenueByBranch.length === 0 && (
                  <p className="text-sm text-on-surface-variant/60 py-6 text-center">لا توجد بيانات فروع</p>
                )}
                {data.revenueByBranch.map((b, i) => {
                  const colors = [C.primary, C.blue, C.green, C.orange, C.purple];
                  const color = colors[i % colors.length];
                  return (
                    <div key={b.branchId}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-on-surface">{b.branchName}</span>
                        <span className="text-xs font-bold text-on-surface-variant">{fmt(b.revenue)} ر.س</span>
                      </div>
                      <div className="relative h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(b.revenue / maxRev) * 100}%` }}
                          transition={{ duration: 1, delay: i * 0.12, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-on-surface-variant/50">{b.ordersCount} طلب</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.06 }}>
            <Card padding="xl">
              <div className="mb-4">
                <h3 className="text-[15px] font-semibold text-on-surface tracking-tight">حالة الطلبات</h3>
                <p className="text-xs text-on-surface-variant/70 mt-0.5">توزيع الطلبات حسب الحالة</p>
              </div>
              <OrdersDonut data={donutData} />
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}>
          <Card padding="xl">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-surface text-primary">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-on-surface">الأكثر مبيعاً</h3>
                <p className="text-[11px] text-on-surface-variant/60 mt-0.5">حسب الكمية والإيرادات</p>
              </div>
            </div>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-start py-3 px-3 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">المنتج</th>
                    <th className="text-start py-3 px-3 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">الكمية</th>
                    <th className="text-start py-3 px-3 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">الإيرادات</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-sm text-on-surface-variant/60">لا توجد بيانات</td></tr>
                  )}
                  {data.topProducts.map((p, i) => (
                    <tr key={p.productId} className="border-b border-gray-50 hover:bg-primary-surface/30 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-on-surface-variant/40">#{i + 1}</span>
                          <span className="font-medium text-on-surface">{p.productName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-on-surface-variant/70">{p.quantity.toLocaleString()}</td>
                      <td className="py-3.5 px-3 font-semibold text-on-surface">{fmt(p.revenue)} ر.س</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
