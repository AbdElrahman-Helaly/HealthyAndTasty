import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useDashboardKpis } from '@/hooks/useDashboardKpis';
import { usePageTitle } from '@/hooks/usePageTitle';

export function DashboardPage() {
  const { data: kpis, isLoading } = useDashboardKpis();
  usePageTitle('لوحة التحكم');
  const [ok, setOk] = useState(false);
  useEffect(() => { setOk(true); }, []);

  if (isLoading) return <div className="p-6"><PageHeader title="لوحة التحكم" subtitle="تحميل..." /><div className="mt-4 text-green-600 font-bold">جار التحميل...</div></div>;
  if (!kpis) return <div className="p-6"><PageHeader title="لوحة التحكم" /><div className="mt-4 text-red-500 font-bold">لا توجد بيانات</div></div>;
  if (!ok) return <div className="p-6 text-blue-500">initializing...</div>;

  return (
    <div className="p-6">
      <PageHeader title="لوحة التحكم" subtitle="اختبار عرض البيانات" />
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">الموظفين النشطين</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{kpis.activeEmployees}</div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">الدول</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{kpis.totalCountries}</div>
        </div>
      </div>
    </div>
  );
}
