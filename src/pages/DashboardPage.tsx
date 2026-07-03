import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import {
  Globe, Building2, Users, Package, TrendingUp, DollarSign,
  ShoppingCart, Activity, UserPlus, RefreshCw, Trash2, CheckCircle2,
  Clock, MapPin, Calendar,
} from 'lucide-react';
import Chart from 'react-apexcharts';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { useDashboardKpis } from '@/hooks/useDashboardKpis';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { ApexOptions } from 'apexcharts';

const COLORS = {
  primary: '#6D4CFF',
  secondary: '#8B5CF6',
  blue: '#3B82F6',
  green: '#22C55E',
  orange: '#F59E0B',
  red: '#EF4444',
  background: '#F8F9FF',
};

function areaChartOptions(color: string): ApexOptions {
  return {
    chart: {
      type: 'area',
      toolbar: { show: false },
      sparkline: { enabled: false },
      fontFamily: 'inherit',
    },
    colors: [color],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    markers: { size: 0 },
    tooltip: {
      enabled: true,
      theme: 'dark',
      x: { show: true },
      marker: { show: false },
    },
    grid: { show: false },
    yaxis: { show: false },
    xaxis: {
      type: 'category',
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
  };
}

function genMonthlyRevenue(): { categories: string[]; data: number[] } {
  return {
    categories: ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    data: [85, 120, 95, 140, 130, 160, 145, 180, 155, 170, 190, 210],
  };
}

function genRevenueArea(): { categories: string[]; data: number[] } {
  return {
    categories: ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4', 'الأسبوع 5', 'الأسبوع 6', 'الأسبوع 7', 'الأسبوع 8'],
    data: [45, 52, 38, 65, 58, 72, 68, 85],
  };
}

function genHeatmapData() {
  const days = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
  return days.map((day) => ({
    name: day,
    data: Array.from({ length: 8 }, () => Math.floor(Math.random() * 5)),
  }));
}

function genActivityTimeline() {
  return [
    { icon: UserPlus, color: COLORS.green, text: 'قام أحمد بإضافة موظف جديد', time: 'منذ 5 دقائق' },
    { icon: RefreshCw, color: COLORS.blue, text: 'تم تحديث منتج - كود PRD-0042', time: 'منذ 15 دقيقة' },
    { icon: Building2, color: COLORS.primary, text: 'تم إنشاء فرع جديد - الرياض', time: 'منذ ساعة' },
    { icon: Trash2, color: COLORS.red, text: 'تم حذف دولة - قطر', time: 'منذ ساعتين' },
    { icon: CheckCircle2, color: COLORS.green, text: 'اكتمال استيراد 42 منتج', time: 'منذ 3 ساعات' },
    { icon: ShoppingCart, color: COLORS.orange, text: 'طلب جديد #INV-2024-891', time: 'منذ 4 ساعات' },
  ];
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
} as any;

function StatCardAnimated({
  label,
  value,
  prefix = '',
  suffix = '',
  icon: Icon,
  iconColor,
  trend,
  decimals = 0,
  delay = 0,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: any;
  iconColor: string;
  trend?: { direction: 'up' | 'down'; value: string };
  decimals?: number;
  delay?: number;
}) {
  return (
    <motion.div variants={fadeUpVariants} initial="hidden" animate="visible" custom={delay}>
      <Card padding="md" hover className="relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-on-surface-variant/80">{label}</span>
            <span className="text-2xl font-bold tabular-nums tracking-tight text-on-surface">
              {prefix && <span className="text-on-surface-variant text-lg ms-0.5">{prefix}</span>}
              <CountUp end={value} duration={2} separator="," decimals={decimals} />
              {suffix && <span className="text-on-surface-variant text-lg me-0.5">{suffix}</span>}
            </span>
            {trend && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${trend.direction === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                  <TrendingUp className={`h-3 w-3 ${trend.direction === 'down' ? 'rotate-180' : ''}`} />
                  {trend.value}
                </span>
                <span className="text-[10px] text-on-surface-variant/50">عن الشهر الماضي</span>
              </div>
            )}
          </div>
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${iconColor}18`, color: iconColor }}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { data: kpis, isLoading } = useDashboardKpis();
  usePageTitle(t('dashboard.title'));
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const rev = genRevenueArea();
  const monthly = genMonthlyRevenue();
  const heatmap = genHeatmapData();
  const activities = genActivityTimeline();

  const revenueChart: ApexOptions = {
    ...areaChartOptions(COLORS.primary),
    chart: { ...areaChartOptions(COLORS.primary).chart, dropShadow: { enabled: true, top: 0, left: 0, blur: 12, color: COLORS.primary, opacity: 0.3 } },
  };

  const donutEmployees: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    colors: [COLORS.green, '#E8F5E9'],
    labels: ['نشط', 'غير نشط'],
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: { size: '75%', labels: { show: true, name: { show: true, fontSize: '13px' }, value: { show: true, fontSize: '22px', fontWeight: 700, color: '#0f172a' }, total: { show: true, fontSize: '13px', label: 'نسبة النشاط', formatter: () => '78%' } } },
      },
    },
    legend: { show: false },
    stroke: { width: 0 },
    tooltip: { enabled: false },
  };

  const donutProducts: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    colors: [COLORS.primary, '#EDE9FE'],
    labels: ['نشط', 'غير نشط'],
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: { size: '75%', labels: { show: true, name: { show: true, fontSize: '13px' }, value: { show: true, fontSize: '22px', fontWeight: 700, color: '#0f172a' }, total: { show: true, fontSize: '13px', label: 'نسبة النشاط', formatter: () => '65%' } } },
      },
    },
    legend: { show: false },
    stroke: { width: 0 },
    tooltip: { enabled: false },
  };

  const barMonthly: ApexOptions = {
    chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false } },
    colors: [COLORS.primary, COLORS.secondary, COLORS.blue, COLORS.green, COLORS.orange, COLORS.red, COLORS.primary, COLORS.secondary, COLORS.blue, COLORS.green, COLORS.orange, COLORS.red],
    plotOptions: { bar: { borderRadius: 6, columnWidth: '60%', distributed: true } },
    dataLabels: { enabled: false },
    grid: { show: false },
    xaxis: { categories: monthly.categories, labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { show: false },
    tooltip: { theme: 'dark' },
  };

  const heatmapOpts: ApexOptions = {
    chart: { type: 'heatmap', fontFamily: 'inherit', toolbar: { show: false } },
    colors: [COLORS.primary],
    dataLabels: { enabled: false },
    xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    grid: { show: false },
    plotOptions: { heatmap: { shadeIntensity: 0.5, radius: 4, enableShades: true, colorScale: { ranges: [{ from: 0, to: 1, color: '#EDE9FE' }, { from: 2, to: 3, color: '#A78BFA' }, { from: 4, to: 5, color: '#6D4CFF' }] } } },
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <div className="lg:col-span-2 h-72 skeleton rounded-2xl" />
          <div className="h-72 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div>
        <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <TrendingUp className="h-12 w-12 text-on-surface-variant/30 mb-4" />
          <p className="text-base font-medium text-on-surface-variant">لا توجد بيانات متاحة حالياً</p>
          <p className="text-sm text-on-surface-variant/60 mt-1">ستظهر الإحصائيات هنا بمجرد توفر البيانات</p>
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="نظرة عامة" subtitle="لوحة التحكم الرئيسية للمنصة" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardAnimated label="إجمالي الإيرادات" value={128430} prefix="$" icon={DollarSign} iconColor={COLORS.green} trend={{ direction: 'up', value: '+18%' }} delay={0} />
        <StatCardAnimated label="إجمالي الطلبات" value={2568} icon={ShoppingCart} iconColor={COLORS.blue} trend={{ direction: 'up', value: '+12%' }} delay={1} />
        <StatCardAnimated label="الموظفين النشطين" value={kpis.activeEmployees} icon={Users} iconColor={COLORS.primary} trend={{ direction: 'up', value: '+8.2%' }} delay={2} />
        <StatCardAnimated label="الدول" value={kpis.totalCountries} icon={Globe} iconColor={COLORS.orange} delay={3} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Area Chart */}
        <motion.div className="lg:col-span-2" variants={fadeUpVariants} initial="hidden" animate="visible" custom={4}>
          <Card padding="lg" className="overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-on-surface">الإيرادات</h3>
                <p className="text-xs text-on-surface-variant/60 mt-0.5">آخر 8 أسابيع</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <TrendingUp className="h-4 w-4" />
                  +18.2%
                </span>
              </div>
            </div>
            {mounted && (
              <Chart options={revenueChart} series={[{ name: 'الإيرادات', data: rev.data }]} type="area" height={280} />
            )}
          </Card>
        </motion.div>

        {/* Donut Charts */}
        <motion.div className="flex flex-col gap-4" variants={fadeUpVariants} initial="hidden" animate="visible" custom={5}>
          <Card padding="lg" className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-green-500" />
              <h3 className="text-sm font-semibold text-on-surface">الموظفين</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 shrink-0">
                {mounted && <Chart options={donutEmployees} series={[78, 22]} type="donut" height={128} />}
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.green }} />
                  <span className="text-on-surface-variant">نشط: </span>
                  <span className="font-bold text-on-surface">{kpis.activeEmployees}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#E8F5E9' }} />
                  <span className="text-on-surface-variant">غير نشط: </span>
                  <span className="font-bold text-on-surface">{kpis.totalEmployees - kpis.activeEmployees}</span>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-on-surface-variant/60 mb-1">معدل النشاط</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full" style={{ backgroundColor: COLORS.green }}
                        initial={{ width: 0 }} animate={{ width: '78%' }}
                        transition={{ duration: 1.5, delay: 1, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-xs font-bold text-on-surface">78%</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-on-surface">المنتجات</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 shrink-0">
                {mounted && <Chart options={donutProducts} series={[65, 35]} type="donut" height={128} />}
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                  <span className="text-on-surface-variant">نشط: </span>
                  <span className="font-bold text-on-surface">{kpis.totalProducts - kpis.failedImports}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#EDE9FE' }} />
                  <span className="text-on-surface-variant">غير نشط: </span>
                  <span className="font-bold text-on-surface">{kpis.failedImports}</span>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-on-surface-variant/60 mb-1">نسبة النشاط</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full" style={{ backgroundColor: COLORS.primary }}
                        initial={{ width: 0 }} animate={{ width: '65%' }}
                        transition={{ duration: 1.5, delay: 1.2, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-xs font-bold text-on-surface">65%</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Bar + Heatmap Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Revenue Bar */}
        <motion.div className="lg:col-span-2" variants={fadeUpVariants} initial="hidden" animate="visible" custom={6}>
          <Card padding="lg" className="overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-on-surface">الإيرادات الشهرية</h3>
                <p className="text-xs text-on-surface-variant/60 mt-0.5">آخر 12 شهر</p>
              </div>
              <div className="text-xs text-on-surface-variant/60">
                <Calendar className="h-3.5 w-3.5 inline me-1" />
                2024
              </div>
            </div>
            {mounted && (
              <Chart options={barMonthly} series={[{ name: 'الإيرادات', data: monthly.data }]} type="bar" height={200} />
            )}
          </Card>
        </motion.div>

        {/* Weekly Activity Heatmap */}
        <motion.div variants={fadeUpVariants} initial="hidden" animate="visible" custom={7}>
          <Card padding="lg" className="overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-on-surface">النشاط الأسبوعي</h3>
            </div>
            {mounted && (
              <Chart options={heatmapOpts} series={heatmap} type="heatmap" height={210} />
            )}
          </Card>
        </motion.div>
      </div>

      {/* Activity + Latest */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity Timeline */}
        <motion.div variants={fadeUpVariants} initial="hidden" animate="visible" custom={8}>
          <Card padding="lg" className="overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-on-surface">آخر النشاطات</h3>
              <span className="text-xs text-primary font-medium cursor-pointer hover:underline">عرض الكل</span>
            </div>
            <div className="flex flex-col">
              {activities.map((act, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.12, duration: 0.4 }}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                    style={{ backgroundColor: `${act.color}15`, color: act.color }}
                  >
                    <act.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{act.text}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3 w-3 text-on-surface-variant/40" />
                      <span className="text-xs text-on-surface-variant/60">{act.time}</span>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full shrink-0 mt-2" style={{ backgroundColor: act.color }} />
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Latest Employees */}
        <motion.div variants={fadeUpVariants} initial="hidden" animate="visible" custom={9}>
          <Card padding="lg" className="overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-on-surface">أحدث الموظفين</h3>
              <span className="text-xs text-primary font-medium cursor-pointer hover:underline">عرض الكل</span>
            </div>
            <div className="flex flex-col">
              {[
                { name: 'أحمد محمد', branch: 'الرياض', role: 'مدير' },
                { name: 'سارة خالد', branch: 'جدة', role: 'مشرف' },
                { name: 'فهد عبدالله', branch: 'الدمام', role: 'موظف' },
                { name: 'نورة سعيد', branch: 'مكة', role: 'محاسب' },
              ].map((emp, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-sm font-bold">
                    {emp.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{emp.name}</p>
                    <p className="text-xs text-on-surface-variant/60">{emp.branch} · {emp.role}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-on-surface-variant/40" />
                    <span className="text-xs text-on-surface-variant/60">{emp.branch}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
