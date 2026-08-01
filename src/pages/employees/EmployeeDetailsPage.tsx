import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight, Mail, Phone, Building2, Shield, UserRound, Power, PowerOff, Save,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { ConfirmDialog } from '@/components/ui/Modal';
import { PermissionGate } from '@/components/auth/PermissionGate';
import {
  getEmployee, updateEmployee, activateEmployee, deactivateEmployee,
  assignEmployeeRole, assignEmployeeBranches,
} from '@/api/employees.api';
import { listRoles } from '@/api/roles.api';
import { listBranches } from '@/api/branches.api';
import { PERMISSIONS } from '@/types/permissions';
import type { BranchAdmin, Employee, RoleDto } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/hooks/useToast';

const profileSchema = z.object({
  firstName: z.string().min(2, 'الاسم الأول مطلوب'),
  lastName: z.string().min(2, 'اسم العائلة مطلوب'),
  phone: z.string().min(6, 'رقم الهاتف مطلوب'),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function EmployeeDetailsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { show: showToast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [branches, setBranches] = useState<BranchAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isSavingBranches, setIsSavingBranches] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [confirmActive, setConfirmActive] = useState(false);

  const [roleId, setRoleId] = useState<number | ''>('');
  const [branchIds, setBranchIds] = useState<string[]>([]);

  usePageTitle(t('employees.detailsTitle'));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await getEmployee(id);
      setEmployee(res);
      reset({
        firstName: res.firstName,
        lastName: res.lastName,
        phone: res.phone,
        email: res.email || '',
      });
      setRoleId(res.roleId);
      setBranchIds(res.branchIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل بيانات الموظف');
    } finally {
      setIsLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void Promise.all([listRoles(), listBranches()])
      .then(([r, b]) => {
        setRoles(r);
        setBranches(b);
      })
      .catch(() => {});
  }, []);

  async function onSaveProfile(data: ProfileForm) {
    if (!employee) return;
    setIsSavingProfile(true);
    try {
      const updated = await updateEmployee(employee.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email || null,
      });
      setEmployee(updated);
      showToast('تم تحديث بيانات الموظف', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشل تحديث البيانات', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function onAssignRole() {
    if (!employee || roleId === '') return;
    setIsSavingRole(true);
    try {
      const updated = await assignEmployeeRole(employee.id, { roleId: Number(roleId) });
      setEmployee(updated);
      showToast('تم تحديث الدور بنجاح', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشل تحديث الدور', 'error');
    } finally {
      setIsSavingRole(false);
    }
  }

  async function onAssignBranches() {
    if (!employee) return;
    setIsSavingBranches(true);
    try {
      const updated = await assignEmployeeBranches(employee.id, { branchIds });
      setEmployee(updated);
      showToast('تم تحديث الفروع بنجاح', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشل تحديث الفروع', 'error');
    } finally {
      setIsSavingBranches(false);
    }
  }

  async function onToggleActive() {
    if (!employee) return;
    setIsTogglingActive(true);
    try {
      const updated = employee.isActive
        ? await deactivateEmployee(employee.id)
        : await activateEmployee(employee.id);
      setEmployee(updated);
      showToast(updated.isActive ? 'تم تفعيل الموظف' : 'تم إيقاف الموظف', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشلت العملية', 'error');
    } finally {
      setIsTogglingActive(false);
      setConfirmActive(false);
    }
  }

  const infoItems = useMemo(
    () => [
      { icon: Mail, label: 'البريد الإلكتروني', value: employee?.email || '—' },
      { icon: Phone, label: 'رقم الهاتف', value: employee?.phone || '—' },
      { icon: Shield, label: 'الدور', value: employee?.role || '—' },
      { icon: Building2, label: 'الفروع', value: employee?.branchNames.join('، ') || '—' },
      { icon: UserRound, label: 'تاريخ الإنشاء', value: employee ? formatDate(employee.createdAt) : '—' },
    ],
    [employee],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-72 skeleton rounded-2xl" />
          <div className="h-72 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div>
        <PageHeader title={t('employees.detailsTitle')} subtitle={t('employees.detailsSubtitle')} />
        <Card padding="xl">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-base font-medium text-on-surface-variant">{error || 'الموظف غير موجود'}</p>
            <Button variant="secondary" className="mt-4" onClick={() => navigate('/employees')}>
              العودة للموظفين
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={employee.name}
        subtitle={t('employees.detailsSubtitle')}
        actions={
          <div className="flex items-center gap-2">
            <PermissionGate permission={PERMISSIONS.EmployeesActivate}>
              <Button
                variant={employee.isActive ? 'danger' : 'success'}
                size="sm"
                loading={isTogglingActive}
                className="gap-1.5"
                onClick={() => setConfirmActive(true)}
              >
                {employee.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                {employee.isActive ? 'إيقاف' : 'تفعيل'}
              </Button>
            </PermissionGate>
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => navigate('/employees')}>
              <ArrowRight className="h-4 w-4" />
              العودة
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile card */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card padding="xl">
            <div className="flex items-center gap-4 mb-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#6D4CFF] text-lg font-bold text-white shadow-lg">
                {employee.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-on-surface">{employee.name}</h3>
                  <span className={employee.isActive ? 'badge badge-success' : 'badge badge-danger'}>
                    {employee.isActive ? 'نشط' : 'موقوف'}
                  </span>
                  {!employee.isProfileCompleted && (
                    <span className="badge badge-warning">ملف غير مكتمل</span>
                  )}
                </div>
                <p className="text-sm text-on-surface-variant/70 mt-0.5">{employee.role}</p>
              </div>
            </div>

            <PermissionGate permission={PERMISSIONS.EmployeesUpdate}>
              <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSaveProfile)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="الاسم الأول" error={errors.firstName?.message} {...register('firstName')} />
                  <Input label="اسم العائلة" error={errors.lastName?.message} {...register('lastName')} />
                  <Input label="رقم الهاتف" dir="ltr" error={errors.phone?.message} {...register('phone')} />
                  <Input label="البريد الإلكتروني" dir="ltr" error={errors.email?.message} {...register('email')} />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" loading={isSavingProfile} className="gap-1.5">
                    <Save className="h-4 w-4" />
                    حفظ البيانات
                  </Button>
                </div>
              </form>
            </PermissionGate>
          </Card>

          {/* Assign role */}
          <PermissionGate permission={PERMISSIONS.EmployeesAssignRole}>
            <Card padding="xl">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-surface text-primary">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-on-surface">تغيير الدور</h3>
                  <p className="text-[11px] text-on-surface-variant/60 mt-0.5">الدور الحالي: {employee.role}</p>
                </div>
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Select value={roleId === '' ? '' : String(roleId)} onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : '')}>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.displayName}</option>
                    ))}
                  </Select>
                </div>
                <Button size="md" loading={isSavingRole} disabled={roleId === '' || roleId === employee.roleId} onClick={() => void onAssignRole()}>
                  حفظ الدور
                </Button>
              </div>
            </Card>
          </PermissionGate>

          {/* Assign branches */}
          <PermissionGate permission={PERMISSIONS.EmployeesAssignBranch}>
            <Card padding="xl">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-surface text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-on-surface">الفروع المرتبطة</h3>
                  <p className="text-[11px] text-on-surface-variant/60 mt-0.5">إدارة فروع الموظف</p>
                </div>
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <MultiSelect
                    options={branches.map((b) => ({ label: b.name, value: b.id }))}
                    value={branchIds}
                    onChange={setBranchIds}
                    placeholder="اختر الفروع"
                  />
                </div>
                <Button size="md" loading={isSavingBranches} onClick={() => void onAssignBranches()}>
                  حفظ الفروع
                </Button>
              </div>
            </Card>
          </PermissionGate>
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-4">
          <Card padding="xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-surface text-primary">
                <UserRound className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-on-surface">بيانات الموظف</h3>
            </div>
            <div className="flex flex-col gap-4">
              {infoItems.map((item) => (
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
      </div>

      <ConfirmDialog
        open={confirmActive}
        onClose={() => setConfirmActive(false)}
        onConfirm={() => void onToggleActive()}
        loading={isTogglingActive}
        title={employee.isActive ? 'إيقاف الموظف' : 'تفعيل الموظف'}
        message={
          employee.isActive
            ? 'هل أنت متأكد من إيقاف هذا الموظف؟ لن يتمكن من تسجيل الدخول بعد الآن.'
            : 'هل أنت متأكد من تفعيل هذا الموظف؟ سيتمكن من تسجيل الدخول.'
        }
        confirmText={employee.isActive ? 'إيقاف' : 'تفعيل'}
        variant={employee.isActive ? 'danger' : 'primary'}
      />
    </div>
  );
}
