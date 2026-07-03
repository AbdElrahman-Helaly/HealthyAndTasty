import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import {
  Globe, Building2, Users, Package, TrendingUp, DollarSign,
  ShoppingCart, Activity, UserPlus, RefreshCw, Trash2, CheckCircle2,
  Clock, MapPin, Calendar,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { useDashboardKpis } from '@/hooks/useDashboardKpis';
import { usePageTitle } from '@/hooks/usePageTitle';

const COLORS = {
  primary: '#6D4CFF',
  secondary: '#8B5CF6',
  blue: '#3B82F6',
  green: '#22C55E',
  orange: '#F59E0B',
  red: '#EF4444',
};

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5, ease: 'easeOut' as const },
  };
}

function AreaSvg() {
  return (
    <svg width="100%" height="220" viewBox="0 0 400 220" preserveAspectRatio="none" className="w-full">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6D4CFF" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#6D4CFF" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <motion.path
        d="M0,180 C30,170 50,160 80,140 C110,120 130,100 160,90 C190,80 210,60 240,45 C270,30 290,35 320,55 C350,75 370,90 400,80 L400,220 L0,220 Z"
        fill="url(#areaGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.path
        d="M0,180 C30,170 50,160 80,140 C110,120 130,100 160,90 C190,80 210,60 240,45 C270,30 290,35 320,55 C350,75 370,90 400,80"
        fill="none" stroke="#6D4CFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />
      <circle cx="240" cy="45" r="4" fill="#6D4CFF" stroke="white" strokeWidth="2" />
    </svg>
  );
}

function BarSvg() {
  const barColors = ['#6D4CFF', '#8B5CF6', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#6D4CFF', '#8B5CF6', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444'];
  const heights = [45, 65, 50, 75, 70, 85, 78, 95, 82, 90, 100, 95];
  return (
    <div className="flex items-end gap-2 h-32 mt-4">
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-t-md"
          style={{ backgroundColor: barColors[i % barColors.length] }}
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ delay: 0.5 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function DonutCard({ pct, color, icon: Icon, title, active, inactive }: { pct: number; color: string; icon: any; title: string; active: number; inactive: number }) {
  const r = 42, cx = 56, cy = 56, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <Card padding="lg" className="flex-1">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4" style={{ color }} />
        <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
      </div>
      <div className="flex items-center gap-4">
        <svg width="112" height="112" viewBox="0 0 112 112" className="shrink-0">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EDE9FE" strokeWidth="10" />
          <motion.circle
            cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circ} strokeLinecap="round"
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
          <text x={cx} y={cy - 3} textAnchor="middle" fontSize="20" fontWeight="bold" fill="#0f172a">{pct}%</text>
          <text x={cx} y={cy + 13} textAnchor="middle" fontSize="10" fill="#64748b">نشط</text>
        </svg>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-on-surface-variant">نشط: </span>
            <span className="font-bold text-on-surface">{active}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#EDE9FE' }} />
            <span className="text-on-surface-variant">غير نشط: </span>
            <span className="font-bold text-on-surface">{inactive}</span>
          </div>
          <div className="mt-1">
            <div className="text-xs text-on-surface-variant/60 mb-1">معدل النشاط</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <motion.div
                  className="h-full rounded-full" style={{ backgroundColor: color }}
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.5, delay: 1, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs font-bold text-on-surface">{pct}%</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function HeatmapSvg() {
  const days = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
  const levels = ['#F5F3FF', '#DDD6FE', '#A78BFA', '#6D4CFF'];
  const data = days.map(() => Array.from({ length: 8 }, () => Math.floor(Math.random() * 4)));
  return (
    <div className="flex flex-col gap-1.5 mt-2">
      {data.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] text-on-surface-variant/60 w-12 text-left">{days[i]}</span>
          <div className="flex gap-1">
            {row.map((v, j) => (
              <div key={j} className="w-8 h-8 rounded-md" style={{ backgroundColor: levels[v] || levels[0] }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCardAnimated({
  label, value, prefix = '', suffix = '',
  icon: Icon, iconColor, trend, delay = 0,
}: {
  label: string; value: number; prefix?: string; suffix?: string;
  icon: any; iconColor: string;
  trend?: { direction: 'up' | 'down'; value: string };
  delay?: number;
}) {
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!started) { setStarted(true); return; }
    const timer = setTimeout(() => {
      let current = 0;
      const step = Math.ceil(value / 40);
      const interval = setInterval(() => {
        current += step;
        if (current >= value) { current = value; clearInterval(interval); }
        setDisplay(current);
      }, 30);
      return () => clearInterval(interval);
    }, delay * 200);
    return () => clearTimeout(timer);
  }, [delay, started]);
  return (
    <motion.div {...fadeUp(delay * 0.08)}>
      <Card padding="md" hover className="relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-on-surface-variant/80">{label}</span>
            <span className="text-2xl font-bold tabular-nums tracking-tight text-on-surface">
              {prefix}<span>{display.toLocaleString()}</span>{suffix}
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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${iconColor}18`, color: iconColor }}>
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
  const activities = [
    { icon: UserPlus, color: COLORS.green, text: 'قام أحمد بإضافة موظف جديد', time: 'منذ 5 دقائق' },
    { icon: RefreshCw, color: COLORS.blue, text: 'تم تحديث منتج - كود PRD-0042', time: 'منذ 15 دقيقة' },
    { icon: Building2, color: COLORS.primary, text: 'تم إنشاء فرع جديد - الرياض', time: 'منذ ساعة' },
    { icon: Trash2, color: COLORS.red, text: 'تم حذف دولة - قطر', time: 'منذ ساعتين' },
    { icon: CheckCircle2, color: COLORS.green, text: 'اكتمال استيراد 42 منتج', time: 'منذ 3 ساعات' },
    { icon: ShoppingCart, color: COLORS.orange, text: 'طلب جديد #INV-2024-891', time: 'منذ 4 ساعات' },
  ];

  if (isLoading) {
    return (
      <div>
        <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="نظرة عامة" subtitle="لوحة التحكم الرئيسية للمنصة" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardAnimated label="إجمالي الإيرادات" value={128430} prefix="$" icon={DollarSign} iconColor={COLORS.green} trend={{ direction: 'up', value: '+18%' }} delay={0} />
        <StatCardAnimated label="إجمالي الطلبات" value={2568} icon={ShoppingCart} iconColor={COLORS.blue} trend={{ direction: 'up', value: '+12%' }} delay={1} />
        <StatCardAnimated label="الموظفين النشطين" value={kpis.activeEmployees} icon={Users} iconColor={COLORS.primary} trend={{ direction: 'up', value: '+8.2%' }} delay={2} />
        <StatCardAnimated label="الدول" value={kpis.totalCountries} icon={Globe} iconColor={COLORS.orange} delay={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div className="lg:col-span-2" {...fadeUp(0.32)}>
          <Card padding="lg" className="overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-on-surface">الإيرادات</h3>
                <p className="text-xs text-on-surface-variant/60 mt-0.5">آخر 8 أسابيع</p>
              </div>
              <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />+18.2%
              </span>
            </div>
            <AreaSvg />
          </Card>
        </motion.div>

        <motion.div className="flex flex-col gap-4" {...fadeUp(0.4)}>
          <DonutCard pct={78} color={COLORS.green} icon={Users} title="الموظفين" active={kpis.activeEmployees} inactive={kpis.totalEmployees - kpis.activeEmployees} />
          <DonutCard pct={65} color={COLORS.primary} icon={Package} title="المنتجات" active={kpis.totalProducts - kpis.failedImports} inactive={kpis.failedImports} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div className="lg:col-span-2" {...fadeUp(0.48)}>
          <Card padding="lg" className="overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-on-surface">الإيرادات الشهرية</h3>
                <p className="text-xs text-on-surface-variant/60 mt-0.5">آخر 12 شهر</p>
              </div>
              <span className="text-xs text-on-surface-variant/60"><Calendar className="h-3.5 w-3.5 inline me-1" />2024</span>
            </div>
            <BarSvg />
          </Card>
        </motion.div>

        <motion.div {...fadeUp(0.56)}>
          <Card padding="lg" className="overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-on-surface">النشاط الأسبوعي</h3>
            </div>
            <HeatmapSvg />
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeUp(0.64)}>
          <Card padding="lg" className="overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-on-surface">آخر النشاطات</h3>
              <span className="text-xs text-primary font-medium cursor-pointer hover:underline">عرض الكل</span>
            </div>
            <div className="flex flex-col">
              {activities.map((act, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5" style={{ backgroundColor: `${act.color}15`, color: act.color }}>
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
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div {...fadeUp(0.72)}>
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
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-sm font-bold">{emp.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{emp.name}</p>
                    <p className="text-xs text-on-surface-variant/60">{emp.branch} · {emp.role}</p>
                  </div>
                  <MapPin className="h-3.5 w-3.5 text-on-surface-variant/40" />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
