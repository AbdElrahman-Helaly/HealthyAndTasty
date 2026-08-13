import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const routeNames: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  branches: 'الفروع',
  'shipping-rates': 'أسعار التوصيل',
  employees: 'الموظفين',
  notifications: 'الإشعارات',
  orders: 'الطلبات',
  'live-orders': 'الطلبات المباشرة',
  roles: 'الأدوار',
  reports: 'التقارير',
  statistics: 'الإحصائيات',
  profile: 'الملف الشخصي',
  unauthorized: 'غير مصرح',
};

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const isRtl = i18n.dir() === 'rtl';

  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, i) => ({
    label: routeNames[part] || part,
    href: '/' + pathParts.slice(0, i + 1).join('/'),
    isLast: i === pathParts.length - 1,
  }));

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        {breadcrumbs.length > 1 && (
          <nav className="flex items-center gap-1.5 mb-1.5">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-on-surface-variant/30 text-xs">{isRtl ? '\\' : '/'}</span>}
                <span className={cn(
                  'text-[11px] font-medium',
                  crumb.isLast ? 'text-on-surface-variant/60' : 'text-on-surface-variant/40'
                )}>
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-[24px] font-bold tracking-tight text-on-surface leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-on-surface-variant/70 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
