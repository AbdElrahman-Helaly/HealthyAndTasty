import { useTranslation } from 'react-i18next';
import {
  Globe,
  Building2,
  Users,
  Package,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { useDashboardKpis } from '@/hooks/useDashboardKpis';
import { usePageTitle } from '@/hooks/usePageTitle';

function genSparkline(base: number, variance: number, points: number): number[] {
  return Array.from({ length: points }, () =>
    Math.max(0, Math.round(base + (Math.random() - 0.5) * variance * 2))
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { data: kpis, isLoading } = useDashboardKpis();
  usePageTitle(t('dashboard.title'));

  if (isLoading || !kpis) return <PageLoader />;

  const stats = [
    {
      label: t('dashboard.totalCountries'),
      value: kpis.totalCountries,
      icon: <Globe className="h-[18px] w-[18px]" />,
      iconBg: 'bg-primary-surface text-primary',
      trend: { direction: 'up' as const, value: '+0%' },
    },
    {
      label: t('dashboard.totalBranches'),
      value: kpis.totalBranches,
      icon: <Building2 className="h-[18px] w-[18px]" />,
      iconBg: 'bg-blue-50 text-blue-600',
      trend: { direction: 'up' as const, value: '+8.3%' },
      sparklineData: genSparkline(40, 8, 8),
    },
    {
      label: t('dashboard.activeBranches'),
      value: kpis.activeBranches,
      icon: <Building2 className="h-[18px] w-[18px]" />,
      iconBg: 'bg-green-50 text-green-600',
      trend: { direction: 'up' as const, value: '+5.1%' },
      sparklineData: genSparkline(38, 6, 8),
    },
    {
      label: t('dashboard.totalEmployees'),
      value: kpis.totalEmployees,
      icon: <Users className="h-[18px] w-[18px]" />,
      iconBg: 'bg-amber-50 text-amber-600',
      trend: { direction: 'up' as const, value: '+12.4%' },
      sparklineData: genSparkline(160, 20, 8),
    },
    {
      label: t('dashboard.activeEmployees'),
      value: kpis.activeEmployees,
      icon: <Users className="h-[18px] w-[18px]" />,
      iconBg: 'bg-green-50 text-green-600',
      trend: { direction: 'up' as const, value: '+10.2%' },
      sparklineData: genSparkline(155, 18, 8),
    },
    {
      label: t('dashboard.totalProducts'),
      value: kpis.totalProducts,
      icon: <Package className="h-[18px] w-[18px]" />,
      iconBg: 'bg-primary-surface text-primary',
      trend: { direction: 'up' as const, value: '+6.8%' },
      sparklineData: genSparkline(2600, 200, 8),
    },
    {
      label: t('dashboard.importsToday'),
      value: kpis.importsToday,
      icon: <Upload className="h-[18px] w-[18px]" />,
      iconBg: 'bg-blue-50 text-blue-600',
      trend: { direction: 'up' as const, value: '+3' },
    },
    {
      label: t('dashboard.importsThisWeek'),
      value: kpis.importsThisWeek,
      icon: <Upload className="h-[18px] w-[18px]" />,
      iconBg: 'bg-blue-50 text-blue-600',
      trend: { direction: 'up' as const, value: '+22%' },
      sparklineData: genSparkline(55, 15, 8),
    },
    {
      label: t('dashboard.importsThisMonth'),
      value: kpis.importsThisMonth,
      icon: <Upload className="h-[18px] w-[18px]" />,
      iconBg: 'bg-primary-surface text-primary',
      trend: { direction: 'up' as const, value: '+18%' },
      sparklineData: genSparkline(210, 35, 8),
    },
    {
      label: t('dashboard.failedImports'),
      value: kpis.failedImports,
      icon: <AlertTriangle className="h-[18px] w-[18px]" />,
      iconBg: 'bg-red-50 text-red-600',
      trend: { direction: 'down' as const, value: '-30%' },
      sparklineData: genSparkline(10, 4, 8),
    },
  ];

  return (
    <div>
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
}
