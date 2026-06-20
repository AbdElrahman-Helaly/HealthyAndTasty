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

export function DashboardPage() {
  const { t } = useTranslation();
  const { data: kpis, isLoading } = useDashboardKpis();
  usePageTitle(t('dashboard.title'));

  if (isLoading || !kpis) return <PageLoader />;

  const stats = [
    { label: t('dashboard.totalCountries'), value: kpis.totalCountries, icon: <Globe className="h-5 w-5" />, iconBg: 'bg-primary/10 text-primary' },
    { label: t('dashboard.totalBranches'), value: kpis.totalBranches, icon: <Building2 className="h-5 w-5" />, iconBg: 'bg-info/10 text-info' },
    { label: t('dashboard.activeBranches'), value: kpis.activeBranches, icon: <Building2 className="h-5 w-5" />, iconBg: 'bg-success/10 text-success' },
    { label: t('dashboard.totalEmployees'), value: kpis.totalEmployees, icon: <Users className="h-5 w-5" />, iconBg: 'bg-accent/10 text-accent' },
    { label: t('dashboard.activeEmployees'), value: kpis.activeEmployees, icon: <Users className="h-5 w-5" />, iconBg: 'bg-success/10 text-success' },
    { label: t('dashboard.totalProducts'), value: kpis.totalProducts, icon: <Package className="h-5 w-5" />, iconBg: 'bg-primary/10 text-primary' },
    { label: t('dashboard.importsToday'), value: kpis.importsToday, icon: <Upload className="h-5 w-5" />, iconBg: 'bg-info/10 text-info' },
    { label: t('dashboard.importsThisWeek'), value: kpis.importsThisWeek, icon: <Upload className="h-5 w-5" />, iconBg: 'bg-info/10 text-info' },
    { label: t('dashboard.importsThisMonth'), value: kpis.importsThisMonth, icon: <Upload className="h-5 w-5" />, iconBg: 'bg-primary/10 text-primary' },
    { label: t('dashboard.failedImports'), value: kpis.failedImports, icon: <AlertTriangle className="h-5 w-5" />, iconBg: 'bg-error/10 text-error' },
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
