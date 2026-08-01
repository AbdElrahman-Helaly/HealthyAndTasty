import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, UserPlus, KeyRound, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { FormDrawer } from '@/components/shared/FormDrawer';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { listEmployees, createEmployee } from '@/api/employees.api';
import { listRoles } from '@/api/roles.api';
import { listBranches } from '@/api/branches.api';
import { PERMISSIONS } from '@/types/permissions';
import type { BranchAdmin, Employee, RoleDto } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/hooks/useToast';

const PAGE_SIZE = 12;

const createSchema = z.object({
  firstName: z.string().min(2, 'الاسم الأول مطلوب'),
  lastName: z.string().min(2, 'اسم العائلة مطلوب'),
  phone: z.string().min(6, 'رقم الهاتف مطلوب'),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  roleId: z.string().min(1, 'الرجاء اختيار الدور'),
});

type CreateForm = z.infer<typeof createSchema>;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function EmployeesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { show: showToast } = useToast();
  const [rows, setRows] = useState<Employee[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [branches, setBranches] = useState<BranchAdmin[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

  usePageTitle(t('employees.title'));

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  const load = useCallback(async (p: number, q: string) => {
    setError('');
    try {
      const res = await listEmployees({ page: p, pageSize: PAGE_SIZE, search: q || undefined });
      setRows(res.items);
      setTotalPages(Math.max(1, res.totalPages));
      setPage(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الموظفين');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(1, search), 300);
    return () => clearTimeout(timer);
  }, [search, load]);

  useEffect(() => {
    void Promise.all([listRoles(), listBranches()])
      .then(([r, b]) => {
        setRoles(r);
        setBranches(b);
      })
      .catch(() => {
        // dropdowns can stay empty; creation will surface errors
      });
  }, []);

  function openDrawer() {
    reset();
    setSelectedBranchIds([]);
    setDrawerOpen(true);
  }

  async function onCreate(data: CreateForm) {
    setIsCreating(true);
    try {
      const res = await createEmployee({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email || null,
        roleId: Number(data.roleId),
        branchIds: selectedBranchIds,
      });
      setDrawerOpen(false);
      if (res.temporaryPassword) {
        setTemporaryPassword(res.temporaryPassword);
      } else {
        showToast('تم إنشاء الموظف بنجاح', 'success');
      }
      void load(1, search);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشل إنشاء الموظف', 'error');
    } finally {
      setIsCreating(false);
    }
  }

  const columns = useMemo<Column<Employee>[]>(
    () => [
      {
        key: 'name',
        header: 'الموظف',
        render: (e) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6D4CFF] text-xs font-bold text-white">
              {e.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-on-surface">{e.name}</p>
              <p className="text-[11px] text-on-surface-variant/60" dir="ltr">{e.phone}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'email',
        header: 'البريد الإلكتروني',
        render: (e) => <span className="text-on-surface-variant/80" dir="ltr">{e.email || '—'}</span>,
      },
      {
        key: 'role',
        header: 'الدور',
        render: (e) => <span className="rounded-full bg-primary-surface px-2.5 py-1 text-xs font-semibold text-primary">{e.role}</span>,
      },
      {
        key: 'branches',
        header: 'الفروع',
        render: (e) => (
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {e.branchNames.length === 0 && <span className="text-on-surface-variant/50">—</span>}
            {e.branchNames.slice(0, 2).map((b) => (
              <span key={b} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-on-surface-variant">{b}</span>
            ))}
            {e.branchNames.length > 2 && <span className="text-[11px] text-on-surface-variant/60">+{e.branchNames.length - 2}</span>}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'الحالة',
        render: (e) => (
          <span className={e.isActive ? 'badge badge-success' : 'badge badge-danger'}>
            {e.isActive ? 'نشط' : 'موقوف'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'تاريخ الإنشاء',
        render: (e) => <span className="text-xs text-on-surface-variant/60">{formatDate(e.createdAt)}</span>,
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title={t('employees.title')}
        subtitle={t('employees.subtitle')}
        actions={
          <PermissionGate permission={PERMISSIONS.EmployeesCreate}>
            <Button size="sm" className="gap-1.5" onClick={openDrawer}>
              <UserPlus className="h-4 w-4" />
              إضافة موظف
            </Button>
          </PermissionGate>
        }
      />

      {/* Filters */}
      <Card padding="md" className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="بحث"
            placeholder="الاسم أو الهاتف أو البريد"
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card padding="none">
        {error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-on-surface-variant">{error}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => void load(page, search)}>
              إعادة المحاولة
            </Button>
          </div>
        )}
        {!error && (
          <>
            <DataTable
              columns={columns}
              data={rows}
              keyExtractor={(e) => String(e.id)}
              onRowClick={(e) => navigate(`/employees/${e.id}`)}
              emptyMessage="لا يوجد موظفون"
            />
            <div className="px-4 pb-4">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => void load(p, search)} />
            </div>
          </>
        )}
      </Card>

      {/* Create employee drawer */}
      <FormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="إضافة موظف جديد"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>إلغاء</Button>
            <Button loading={isCreating} onClick={() => void handleSubmit(onCreate)()}>إنشاء الموظف</Button>
          </div>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onCreate)}>
          <Input label="الاسم الأول" placeholder="محمد" error={errors.firstName?.message} {...register('firstName')} />
          <Input label="اسم العائلة" placeholder="أحمد" error={errors.lastName?.message} {...register('lastName')} />
          <Input label="رقم الهاتف" placeholder="05xxxxxxxx" dir="ltr" error={errors.phone?.message} {...register('phone')} />
          <Input label="البريد الإلكتروني (اختياري)" placeholder="name@example.com" dir="ltr" error={errors.email?.message} {...register('email')} />
          <Select
            label="الدور"
            error={errors.roleId?.message}
            defaultValue=""
            onChange={(e) => setValue('roleId', e.target.value, { shouldValidate: true })}
          >
            <option value="" disabled>اختر الدور</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.displayName}</option>
            ))}
          </Select>
          <MultiSelect
            label="الفروع"
            options={branches.map((b) => ({ label: b.name, value: b.id }))}
            value={selectedBranchIds}
            onChange={setSelectedBranchIds}
            placeholder="اختر الفروع"
          />
        </form>
      </FormDrawer>

      {/* Temporary password modal */}
      <Modal open={temporaryPassword !== null} onClose={() => setTemporaryPassword(null)} title="تم إنشاء الموظف">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-success">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="text-sm text-on-surface-variant">كلمة المرور المؤقتة تظهر مرة واحدة فقط. يرجى حفظها وإرسالها للموظف:</p>
          <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <KeyRound className="h-4 w-4 text-amber-600" />
            <span className="font-mono text-lg font-bold text-amber-700" dir="ltr">{temporaryPassword}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setTemporaryPassword(null)}>حسناً</Button>
        </div>
      </Modal>
    </div>
  );
}
