import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Save } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getRolePermissions, listPermissions, listRoles, setRolePermissions } from '@/api/roles.api';
import type { PermissionDto, RoleDto } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

export function RolePermissionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { roleId } = useParams<{ roleId: string }>();
  const { show: showToast } = useToast();
  const [role, setRole] = useState<RoleDto | null>(null);
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  usePageTitle(t('roles.permissionsTitle'));

  const load = useCallback(async () => {
    if (!roleId) return;
    setIsLoading(true);
    setError('');
    try {
      const numericId = Number(roleId);
      const [all, assigned, roles] = await Promise.all([
        listPermissions(),
        getRolePermissions(numericId),
        listRoles(),
      ]);
      setPermissions(all);
      setSelected(new Set(assigned.map((p) => p.id)));
      setRole(roles.find((r) => r.id === numericId) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الصلاحيات');
    } finally {
      setIsLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, PermissionDto[]>();
    for (const p of permissions) {
      const module = p.module || 'Other';
      const list = map.get(module) ?? [];
      list.push(p);
      map.set(module, list);
    }
    return Array.from(map.entries());
  }, [permissions]);

  function togglePermission(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleModule(module: string) {
    const ids = grouped.find(([m]) => m === module)?.[1].map((p) => p.id) ?? [];
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  async function onSave() {
    if (!roleId) return;
    setIsSaving(true);
    try {
      await setRolePermissions(Number(roleId), { permissionIds: Array.from(selected) });
      showToast('تم حفظ صلاحيات الدور بنجاح', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشل حفظ الصلاحيات', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="h-96 skeleton rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title={t('roles.permissionsTitle')} subtitle={t('roles.permissionsSubtitle')} />
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
      <PageHeader
        title={`صلاحيات دور ${role?.displayName ?? ''}`}
        subtitle={t('roles.permissionsSubtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => navigate('/roles')}>
              <ArrowRight className="h-4 w-4" />
              الأدوار
            </Button>
            <Button size="sm" loading={isSaving} className="gap-1.5" onClick={() => void onSave()}>
              <Save className="h-4 w-4" />
              حفظ الصلاحيات
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        {grouped.map(([module, perms]) => {
          const ids = perms.map((p) => p.id);
          const allSelected = ids.every((id) => selected.has(id));
          const someSelected = ids.some((id) => selected.has(id));
          return (
            <Card key={module} padding="lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-surface text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-on-surface">{module}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                    {perms.filter((p) => selected.has(p.id)).length}/{perms.length}
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={() => toggleModule(module)}
                    className="h-4 w-4 rounded border-[#D7CCF6] text-[#6D3EEA] focus:ring-[#6D3EEA]/30"
                  />
                  <span className="text-xs font-medium text-on-surface-variant">تحديد الكل</span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {perms.map((p) => (
                  <label
                    key={p.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all',
                      selected.has(p.id)
                        ? 'border-[#6D3EEA]/40 bg-[#6D3EEA]/[0.06] shadow-sm'
                        : 'border-outline-variant/30 bg-surface hover:bg-surface-container/60',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => togglePermission(p.id)}
                      className="h-4 w-4 rounded border-[#D7CCF6] text-[#6D3EEA] focus:ring-[#6D3EEA]/30"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{p.displayName}</p>
                      <p className="text-[10px] text-on-surface-variant/50 font-mono truncate" dir="ltr">{p.name}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
