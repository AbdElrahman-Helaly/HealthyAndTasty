import { useTranslation } from 'react-i18next';
import {
  Mail, Phone, Shield, Building2, UserRound, CalendarDays, BadgeCheck, Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, role, permissions, assignedBranches, logout } = useAuth();
  usePageTitle(t('profile.title'));

  if (!user) return null;

  const items = [
    { icon: Mail, label: 'البريد الإلكتروني', value: user.email || '—' },
    { icon: Phone, label: 'رقم الهاتف', value: user.phone || '—' },
    { icon: Shield, label: 'الدور', value: role?.displayName ?? user.role },
    { icon: Building2, label: 'الفروع المكلف بها', value: assignedBranches.length ? assignedBranches.map((b) => b.name).join('، ') : '—' },
    { icon: UserRound, label: 'المعرف', value: `#${user.id}` },
  ];

  const groupedPermissions = (() => {
    const map = new Map<string, string[]>();
    for (const p of permissions) {
      const module = p.split('.')[0] ?? 'Other';
      const list = map.get(module) ?? [];
      list.push(p);
      map.set(module, list);
    }
    return Array.from(map.entries());
  })();

  return (
    <div>
      <PageHeader
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
        actions={
          <Button variant="secondary" size="sm" onClick={() => void logout()}>
            تسجيل الخروج
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Identity card */}
        <div className="lg:col-span-1">
          <Card padding="xl">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#6D4CFF] text-2xl font-bold text-white shadow-lg shadow-purple-200">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="absolute -bottom-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-white">
                  <BadgeCheck className="h-3.5 w-3.5" />
                </span>
              </div>
              <h2 className="mt-4 text-lg font-bold text-on-surface">{user.name}</h2>
              <span className="mt-1 rounded-full bg-primary-surface px-3 py-1 text-xs font-semibold text-primary">
                {role?.displayName ?? user.role}
              </span>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-on-surface-variant/60">
                <CalendarDays className="h-3.5 w-3.5" />
                حساب نشط
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 pt-5 border-t border-gray-100">
              {items.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-on-surface-variant">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-on-surface-variant/60">{item.label}</p>
                    <p className="text-sm font-medium text-on-surface break-words">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Permissions */}
        <div className="lg:col-span-2">
          <Card padding="xl">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-surface text-primary">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-on-surface">الصلاحيات الممنوحة</h3>
                <p className="text-[11px] text-on-surface-variant/60 mt-0.5">
                  {permissions.length} صلاحية من أصل صلاحيات الدور
                </p>
              </div>
            </div>
            {groupedPermissions.length === 0 && (
              <p className="text-sm text-on-surface-variant/60 py-6 text-center">لا توجد صلاحيات ممنوحة</p>
            )}
            <div className="flex flex-col gap-5">
              {groupedPermissions.map(([module, perms]) => (
                <div key={module}>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant/50">{module}</h4>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((p) => (
                      <span key={p} className="rounded-full bg-primary-surface px-3 py-1.5 text-xs font-medium text-primary" dir="ltr">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
