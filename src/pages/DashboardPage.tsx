import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Users, DollarSign, ShoppingCart, Building2,
  Bell, Clock, RefreshCw,
  UserPlus, Activity, Download, Package, BadgePercent,
  Leaf, Wallet, ReceiptText,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getStatistics } from '@/api/statistics.api';
import { listNotifications } from '@/api/notifications.api';
import type { DashboardStatistics, NotificationListItem, OrderStatusNumber } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';

const C = { primary: '#6D4CFF', green: '#22C55E', blue: '#3B82F6', orange: '#F59E0B', red: '#EF4444', purple: '#8B5CF6' };

const statusConfig: Record<OrderStatusNumber, { label: string; className: string; color: string }> = {
  1: { label: 'قيد الانتظار', className: 'badge badge-warning', color: '#F59E0B' },
  2: { label: 'مؤكد', className: 'badge badge-info', color: '#3B82F6' },
  3: { label: 'فشل المزامنة', className: 'badge badge-neutral', color: '#94A3B8' },
  4: { label: 'ملغي', className: 'badge badge-danger', color: '#EF4444' },
  5: { label: 'مكتمل', className: 'badge badge-success', color: '#14B8A6' },
  6: { label: 'قيد التحضير', className: 'badge badge-indigo', color: '#6366F1' },
  7: { label: 'جاهز للتوصيل', className: 'badge badge-purple', color: '#8B5CF6' },
  8: { label: 'خارج للتوصيل', className: 'badge badge-cyan', color: '#0EA5E9' },
  9: { label: 'تم التوصيل', className: 'badge badge-success', color: '#22C55E' },
  10: { label: 'مرفوض', className: 'badge badge-danger', color: '#F43F5E' },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
  return n.toLocaleString();
}

function fadeUp(delay: number) {
  return { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.35, ease: 'easeOut' as const } };
}

// ===== Orders Donut =====
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

// ===== Top Products Table =====
function TopProductsTable({ products }: { products: DashboardStatistics['topProducts'] }) {
  if (!products.length) return <div className="flex items-center justify-center h-32 text-sm text-on-surface-variant/60">لا توجد منتجات</div>;

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-start py-3.5 px-3 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">المنتج</th>
            <th className="text-start py-3.5 px-3 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">الكمية المباعة</th>
            <th className="text-start py-3.5 px-3 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">الإيرادات</th>
          </tr>
        </thead>
        <tbody>
          {products.slice(0, 8).map((p, i) => (
            <motion.tr
              key={p.productId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              className="border-b border-gray-50 hover:bg-primary-surface/30 transition-colors"
            >
              <td className="py-3.5 px-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: C.primary }} />
                  <span className="text-sm font-semibold text-on-surface">{p.productName}</span>
                </div>
              </td>
              <td className="py-3.5 px-3 text-sm text-on-surface-variant/70">{p.quantity.toLocaleString()}</td>
              <td className="py-3.5 px-3 text-sm font-semibold text-on-surface">{fmt(p.revenue)} ج.م</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== Branch Bars =====
function BranchBars({ branches }: { branches: DashboardStatistics['revenueByBranch'] }) {
  if (!branches.length) return <div className="flex items-center justify-center h-32 text-sm text-on-surface-variant/60">لا توجد بيانات فروع</div>;
  const maxRev = Math.max(...branches.map(b => b.revenue));
  const branchColors = [C.primary, C.blue, C.green, C.orange, C.purple];

  return (
    <div className="flex flex-col gap-5">
      {branches.slice(0, 5).map((b, i) => {
        const revPct = (b.revenue / maxRev) * 100;
        return (
          <div key={b.branchId}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: branchColors[i % branchColors.length] }} />
                <span className="text-sm font-semibold text-on-surface">{b.branchName}</span>
              </div>
              <span className="text-xs font-bold text-on-surface-variant">{fmt(b.revenue)} ج.م</span>
            </div>
            <div className="relative h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${revPct}%` }}
                transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: branchColors[i % branchColors.length] }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-on-surface-variant/50">{b.ordersCount} طلب</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} يوم`;
}

function SkeletonRow() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-8 w-48 skeleton rounded-lg" />
      <div className="h-40 skeleton rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 skeleton rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-72 skeleton rounded-2xl" />
        <div className="h-72 skeleton rounded-2xl" />
      </div>
      <div className="h-52 skeleton rounded-2xl" />
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardStatistics | null>(null);
  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  usePageTitle(t('dashboard.title'));

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([getStatistics(), listNotifications({ pageSize: 5 })])
      .then(([stats, notifPage]) => {
        if (cancelled) return;
        setData(stats);
        setNotifications(notifPage.items);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'فشل تحميل البيانات');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (isLoading) return <SkeletonRow />;

  if (error || !data) {
    return (
      <div>
        <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-base font-medium text-on-surface-variant">{error || 'لا توجد بيانات متاحة حالياً'}</p>
          <Button variant="secondary" className="mt-4 gap-1.5" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  const donutData = data.ordersByStatus
    .filter(s => s.count > 0)
    .map(s => ({ label: statusConfig[s.statusNumber].label, value: s.count, color: statusConfig[s.statusNumber].color }));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="نظرة عامة" subtitle="لوحة التحكم الرئيسية للمنصة" />

      {/* Quick Actions + Brand Identity */}
      <motion.div {...fadeUp(0)}>
        <Card padding="lg" glass>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D4CFF] to-[#8B5CF6] shadow-lg shadow-purple-200">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-on-surface">Healthy &amp; Tasty</h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Super Admin</span>
                </div>
                <p className="text-xs text-on-surface-variant/70 mt-0.5">منصة متكاملة لإدارة الفروع والموظفين والطلبات</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="primary" size="sm" className="gap-1.5" onClick={() => navigate('/employees')}>
                <UserPlus className="h-4 w-4" />
                إدارة الموظفين
              </Button>
              <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => navigate('/branches')}>
                <Building2 className="h-4 w-4" />
                الفروع
              </Button>
              <Button variant="success" size="sm" className="gap-1.5" onClick={() => navigate('/orders')}>
                <Package className="h-4 w-4" />
                الطلبات
              </Button>
              <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => navigate('/reports')}>
                <Download className="h-4 w-4" />
                التقارير
              </Button>
            </div>
          </div>

          {/* Brand stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
            {[
              { label: 'إجمالي الطلبات', value: data.totalOrders, icon: ShoppingCart, color: '#6D4CFF' },
              { label: 'إجمالي العملاء', value: data.totalCustomers, icon: Users, color: '#22C55E' },
              { label: 'الطلبات المكتملة', value: data.deliveredOrders, icon: BadgePercent, color: '#3B82F6' },
              { label: 'طلبات اليوم', value: data.todayOrders, icon: Activity, color: '#F59E0B' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${s.color}12`, color: s.color }}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[17px] font-bold tabular-nums text-on-surface leading-none">{s.value.toLocaleString()}</p>
                  <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="الإيرادات الإجمالية"
          value={`${fmt(data.totalRevenue)} ج.م`}
          icon={<DollarSign className="h-5 w-5" />}
          iconColor={C.green}
          comparisonText="كل الفترات"
          index={0}
        />
        <StatCard
          label="إيرادات اليوم"
          value={`${fmt(data.todayRevenue)} ج.م`}
          icon={<Wallet className="h-5 w-5" />}
          iconColor={C.blue}
          comparisonText="آخر 24 ساعة"
          index={1}
        />
        <StatCard
          label="إجمالي الطلبات"
          value={data.totalOrders.toLocaleString()}
          icon={<ShoppingCart className="h-5 w-5" />}
          iconColor={C.primary}
          comparisonText={`${data.todayOrders.toLocaleString()} اليوم`}
          index={2}
        />
        <StatCard
          label="متوسط قيمة الطلب"
          value={`${fmt(data.averageOrderValue)} ج.م`}
          icon={<ReceiptText className="h-5 w-5" />}
          iconColor={C.orange}
          comparisonText="لكل طلب"
          index={3}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div className="lg:col-span-2" {...fadeUp(0.08)}>
          <Card padding="xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-on-surface tracking-tight">الإيرادات حسب الفرع</h3>
                <p className="text-xs text-on-surface-variant/70 mt-0.5">أداء {data.revenueByBranch.length} فروع</p>
              </div>
            </div>
            <BranchBars branches={data.revenueByBranch} />
          </Card>
        </motion.div>

        <motion.div {...fadeUp(0.12)}>
          <Card padding="xl">
            <div className="mb-4">
              <h3 className="text-[15px] font-semibold text-on-surface tracking-tight">حالة الطلبات</h3>
              <p className="text-xs text-on-surface-variant/70 mt-0.5">توزيع الطلبات حسب الحالة</p>
            </div>
            <OrdersDonut data={donutData} />
          </Card>
        </motion.div>
      </div>

      {/* Top products table */}
      <motion.div {...fadeUp(0.16)}>
        <Card padding="xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-semibold text-on-surface tracking-tight">الأكثر مبيعاً</h3>
              <p className="text-xs text-on-surface-variant/70 mt-0.5">أفضل {Math.min(data.topProducts.length, 8)} منتجات حسب الإيرادات</p>
            </div>
          </div>
          <TopProductsTable products={data.topProducts} />
        </Card>
      </motion.div>

      {/* Bottom row: Status breakdown + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeUp(0.2)}>
          <Card padding="xl">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-surface text-primary">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-on-surface">حالة الطلبات بالتفصيل</h3>
                <p className="text-[11px] text-on-surface-variant/60 mt-0.5">عدد الطلبات لكل حالة</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {data.ordersByStatus.length === 0 && (
                <p className="text-sm text-on-surface-variant/60 py-4 text-center">لا توجد بيانات</p>
              )}
              {data.ordersByStatus.slice(0, 6).map((s) => {
                const cfg = statusConfig[s.statusNumber];
                const pct = data.totalOrders > 0 ? (s.count / data.totalOrders) * 100 : 0;
                return (
                  <div key={s.statusNumber} className="flex items-center gap-3">
                    <span className={cfg.className} style={{ minWidth: 110 }}>{cfg.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: cfg.color }}
                      />
                    </div>
                    <span className="text-sm font-bold tabular-nums text-on-surface w-10 text-end">{s.count}</span>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-lg font-bold tabular-nums text-red-500">{data.cancelledOrders}</p>
                <p className="text-[10px] text-on-surface-variant/60 mt-0.5">ملغي</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold tabular-nums text-rose-500">{data.rejectedOrders}</p>
                <p className="text-[10px] text-on-surface-variant/60 mt-0.5">مرفوض</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold tabular-nums text-slate-500">{data.failedToSyncOrders}</p>
                <p className="text-[10px] text-on-surface-variant/60 mt-0.5">فشل المزامنة</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div {...fadeUp(0.24)}>
          <Card padding="xl">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-surface text-primary">
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-on-surface">آخر الإشعارات</h3>
                <p className="text-[11px] text-on-surface-variant/60 mt-0.5">أحداث وتحديثات المنصة</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>عرض الكل</Button>
            </div>
            <div className="flex flex-col gap-1">
              {notifications.length === 0 ? (
                <p className="text-sm text-on-surface-variant/60 py-4 text-center">لا توجد إشعارات</p>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="flex items-start gap-3 py-3 px-2 rounded-xl hover:bg-primary-surface/20 transition-colors">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-surface text-primary">
                      {n.title.includes('طلب') ? <ShoppingCart className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface">{n.title}</p>
                      <p className="text-xs text-on-surface-variant/70 mt-0.5">{n.body}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-on-surface-variant/30" />
                        <span className="text-xs text-on-surface-variant/50">{timeAgo(n.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
