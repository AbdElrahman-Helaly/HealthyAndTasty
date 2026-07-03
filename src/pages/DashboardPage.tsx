import { useTranslation } from 'react-i18next';
import {
  Globe,
  Building2,
  Users,
  Package,
  Upload,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard, StatCardSkeleton } from '@/components/ui/Card';
import { useDashboardKpis } from '@/hooks/useDashboardKpis';
import { usePageTitle } from '@/hooks/usePageTitle';

function genSparkline(base: number, variance: number, points: number): number[] {
  return Array.from({ length: points }, () =>
    Math.max(0, Math.round(base + (Math.random() - 0.5) * variance * 2))
  );
}

const AR_COMPARE = 'عن الأسبوع الماضي';
const AR_COMPARE_WEEK = 'عن الأسبوع الماضي';
const AR_COMPARE_MONTH = 'عن الشهر الماضي';
const statConfigs = [
  {
    key: 'totalCountries',
    labelKey: 'dashboard.totalCountries',
    icon: <Globe className="h-[18px] w-[18px]" />,
    iconColor: '#7C3AED',
    trend: { direction: 'up' as const, value: '+0%' },
    comparisonText: AR_COMPARE,
  },
  {
    key: 'totalBranches',
    labelKey: 'dashboard.totalBranches',
    icon: <Building2 className="h-[18px] w-[18px]" />,
    iconColor: '#2563EB',
    trend: { direction: 'up' as const, value: '+8.3%' },
    comparisonText: AR_COMPARE,
    sparklineData: genSparkline(40, 8, 8),
    hoverDetail: 'إجمالي الفروع النشطة: 42 | غير نشط: 5',
  },
  {
    key: 'activeBranches',
    labelKey: 'dashboard.activeBranches',
    icon: <Building2 className="h-[18px] w-[18px]" />,
    iconColor: '#16A34A',
    trend: { direction: 'up' as const, value: '+5.1%' },
    comparisonText: AR_COMPARE,
    sparklineData: genSparkline(38, 6, 8),
    hoverDetail: 'نسبة النشاط: 89.4% من إجمالي الفروع',
  },
  {
    key: 'totalEmployees',
    labelKey: 'dashboard.totalEmployees',
    icon: <Users className="h-[18px] w-[18px]" />,
    iconColor: '#F59E0B',
    trend: { direction: 'up' as const, value: '+12.4%' },
    comparisonText: AR_COMPARE,
    sparklineData: genSparkline(160, 20, 8),
    hoverDetail: 'موظفون نشطون: 172 | إجمالي: 186',
  },
  {
    key: 'activeEmployees',
    labelKey: 'dashboard.activeEmployees',
    icon: <Users className="h-[18px] w-[18px]" />,
    iconColor: '#16A34A',
    trend: { direction: 'up' as const, value: '+10.2%' },
    comparisonText: AR_COMPARE,
    sparklineData: genSparkline(155, 18, 8),
    hoverDetail: 'نسبة النشاط: 92.5% من إجمالي الموظفين',
  },
  {
    key: 'totalProducts',
    labelKey: 'dashboard.totalProducts',
    icon: <Package className="h-[18px] w-[18px]" />,
    iconColor: '#7C3AED',
    trend: { direction: 'up' as const, value: '+6.8%' },
    comparisonText: AR_COMPARE,
    sparklineData: genSparkline(2600, 200, 8),
    hoverDetail: 'منتجات نشطة: 2,512 | متوقفة: 328',
  },
  {
    key: 'importsToday',
    labelKey: 'dashboard.importsToday',
    icon: <Upload className="h-[18px] w-[18px]" />,
    iconColor: '#2563EB',
    trend: { direction: 'up' as const, value: '+3' },
    comparisonText: 'عن أمس',
  },
  {
    key: 'importsThisWeek',
    labelKey: 'dashboard.importsThisWeek',
    icon: <Upload className="h-[18px] w-[18px]" />,
    iconColor: '#2563EB',
    trend: { direction: 'up' as const, value: '+22%' },
    comparisonText: AR_COMPARE_WEEK,
    sparklineData: genSparkline(55, 15, 8),
    hoverDetail: 'متوسط الاستيراد اليومي: 9.7',
  },
  {
    key: 'importsThisMonth',
    labelKey: 'dashboard.importsThisMonth',
    icon: <Upload className="h-[18px] w-[18px]" />,
    iconColor: '#7C3AED',
    trend: { direction: 'up' as const, value: '+18%' },
    comparisonText: AR_COMPARE_MONTH,
    sparklineData: genSparkline(210, 35, 8),
    hoverDetail: 'معدل الإنجاز: 81.7% من المستهدف الشهري',
  },
  {
    key: 'failedImports',
    labelKey: 'dashboard.failedImports',
    icon: <AlertTriangle className="h-[18px] w-[18px]" />,
    iconColor: '#DC2626',
    trend: { direction: 'down' as const, value: '-30%' },
    comparisonText: AR_COMPARE,
    sparklineData: genSparkline(10, 4, 8),
    alert: true,
    hoverDetail: 'معدل الفشل: 2.9% | الأكثر تأثراً: فرع الرياض',
  },
];

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { data: kpis, isLoading } = useDashboardKpis();
  usePageTitle(t('dashboard.title'));
  const isRtl = i18n.dir() === 'rtl';

  if (isLoading) {
    return (
      <div>
        <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
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
          <p className="text-base font-medium text-on-surface-variant">
            {isRtl ? 'لا توجد بيانات متاحة حالياً' : 'No data available'}
          </p>
          <p className="text-sm text-on-surface-variant/60 mt-1">
            {isRtl ? 'ستظهر الإحصائيات هنا بمجرد توفر البيانات' : 'Statistics will appear here once data is available'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {statConfigs.map((cfg) => {
          const value = kpis[cfg.key as keyof typeof kpis] ?? 0;
          return (
            <StatCard
              key={cfg.key}
              label={t(cfg.labelKey)}
              value={value}
              icon={cfg.icon}
              iconColor={cfg.iconColor}
              trend={cfg.trend}
              comparisonText={cfg.comparisonText}
              sparklineData={cfg.sparklineData}
              alert={cfg.alert}
              hoverDetail={cfg.hoverDetail}
            />
          );
        })}
      </div>
    </div>
  );
}
