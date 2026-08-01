import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, KeyRound } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { listRoles } from '@/api/roles.api';
import type { RoleDto } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';

const roleIconMap: Record<string, { icon: typeof Shield; gradient: string }> = {
  superadmin: { icon: Shield, gradient: 'linear-gradient(135deg, #8B5CF6, #6D4CFF)' },
  admin: { icon: Users, gradient: 'linear-gradient(135deg, #38BDF8, #2563EB)' },
  employee: { icon: KeyRound, gradient: 'linear-gradient(135deg, #34D399, #059669)' },
};

const defaultGradient = { icon: Shield, gradient: 'linear-gradient(135deg, #94A3B8, #475569)' };

export function RolesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  usePageTitle(t('roles.title'));

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await listRoles();
      setRoles(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الأدوار');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title={t('roles.title')} subtitle={t('roles.subtitle')} />
        <Card padding="xl">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-base font-medium text-on-surface-variant">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={() => void load()}>
              إعادة المحاولة
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('roles.title')} subtitle={t('roles.subtitle')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const cfg = roleIconMap[role.name.toLowerCase()] ?? defaultGradient;
          return (
            <Card key={role.id} padding="lg" hover glass>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg" style={{ background: cfg.gradient }}>
                  <cfg.icon className="h-6 w-6 text-white" />
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {role.name}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-on-surface">{role.displayName}</h3>
              <p className="mt-1 text-xs text-on-surface-variant/60">
                إدارة صلاحيات هذا الدور والوصول إلى الصفحات
              </p>
              <div className="mt-5 pt-4 border-t border-gray-100">
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/roles/${role.id}/permissions`)}>
                  إدارة الصلاحيات
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
