import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Pencil, Trash2, RefreshCw, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { FormDrawer } from '@/components/shared/FormDrawer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSkeleton, Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useEmployeeDetails, useEmployees, useRoles } from '@/hooks/useEmployeeDetails';
import { useBranches } from '@/hooks/useBranchDetails';
import { createEmployee, deleteEmployee, updateEmployee, changeUserRole } from '@/services/employee.service';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatDate } from '@/lib/utils';
import type { Employee, EmployeeUpdateRequest } from '@/types';

// ---------------------------------------------------------------------------
// Skeleton row component for loading state
// ---------------------------------------------------------------------------
function SkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-b border-outline-variant/20">
          {[120, 100, 100, 160, 100, 120, 80].map((w, j) => (
            <td key={j} className="px-4 py-3">
              <LoadingSkeleton className={`h-4 w-[${w}px]`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Create Employee Drawer
// ---------------------------------------------------------------------------
interface CreateDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function CreateEmployeeDrawer({ open, onClose, onSaved }: CreateDrawerProps) {
  const { t } = useTranslation();
  const { data: branches, isLoading: branchesLoading } = useBranches();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneE164: '',
    employeeCode: '',
    employeeBranchId: '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.employeeCode || !form.password || !form.firstName) {
      setError('Employee code, password, and first name are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createEmployee(form);
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phoneE164: '',
        employeeCode: '',
        employeeBranchId: '',
        password: '',
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title="إضافة موظف جديد"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            {error && <span className="text-error">{error}</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button loading={saving} onClick={handleSave}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="الاسم الأول" value={form.firstName} onChange={set('firstName')} />
          <Input label="الاسم الأخير" value={form.lastName} onChange={set('lastName')} />
        </div>
        <Input label="البريد الإلكتروني" type="email" value={form.email} onChange={set('email')} />
        <Input label="رقم الهاتف" value={form.phoneE164} onChange={set('phoneE164')} placeholder="+10001234567" />
        <Input label="كود الموظف" value={form.employeeCode} onChange={set('employeeCode')} placeholder="EMP-001" />
        <Input label="كلمة المرور" type="password" value={form.password} onChange={set('password')} />

        <div>
          <label className="text-sm font-semibold text-gray-800">{t('nav.branches')}</label>
          <select
            value={form.employeeBranchId}
            onChange={set('employeeBranchId')}
            disabled={branchesLoading}
            className="mt-1.5 h-[48px] w-full rounded-2xl border border-[#DDD6FE] bg-[#F9FAFF] px-4 text-sm text-gray-900 transition-all duration-200 focus:border-[#7C3AED] focus:shadow-[0_0_0_4px_rgba(124,58,237,0.12)] focus:outline-none disabled:opacity-50"
          >
            <option value="">{branchesLoading ? t('common.loading') : '—'}</option>
            {(branches ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.countryCode})
              </option>
            ))}
          </select>
        </div>
      </div>
    </FormDrawer>
  );
}

// ---------------------------------------------------------------------------
// Edit Employee Drawer
// ---------------------------------------------------------------------------
interface EditDrawerProps {
  employeeId: string | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function EditEmployeeDrawer({ employeeId, open, onClose, onSaved }: EditDrawerProps) {
  const { t } = useTranslation();
  const { data: employee, isLoading, error, refetch } = useEmployeeDetails(employeeId ?? undefined);
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: branches, isLoading: branchesLoading } = useBranches();

  const [form, setForm] = useState<Partial<EmployeeUpdateRequest>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const getValue = (field: keyof EmployeeUpdateRequest): string => {
    if (form[field] !== undefined) return String(form[field]);
    if (!employee) return '';
    const map: Record<keyof EmployeeUpdateRequest, string> = {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phoneE164: employee.phoneE164,
      employeeCode: employee.employeeCode,
      employeeBranchId: employee.employeeBranchId,
      password: '',
    };
    return map[field];
  };

  const set = (field: keyof EmployeeUpdateRequest) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!employeeId || !employee) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload: EmployeeUpdateRequest = {
        firstName: getValue('firstName'),
        lastName: getValue('lastName'),
        email: getValue('email'),
        phoneE164: getValue('phoneE164'),
        employeeCode: getValue('employeeCode'),
        employeeBranchId: getValue('employeeBranchId'),
      };
      const pw = getValue('password');
      if (pw) payload.password = pw;

      await updateEmployee(employeeId, payload);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      onSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Role change state
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [roleChanging, setRoleChanging] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const handleRoleConfirm = async () => {
    if (!employee || !pendingRole) return;
    setRoleChanging(true);
    setRoleError(null);
    try {
      await changeUserRole(employee.userId, pendingRole);
      setPendingRole(null);
      refetch();
      onSaved();
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : 'Failed to change role');
      setPendingRole(null);
    } finally {
      setRoleChanging(false);
    }
  };

  return (
    <>
      <FormDrawer
        open={open}
        onClose={onClose}
        title={t('common.edit') + ' ' + t('nav.employees').replace(/s$/, '')}
        footer={
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">
              {saveError && <span className="text-error">{saveError}</span>}
              {roleError && <span className="text-error">{roleError}</span>}
              {successMsg && <span className="text-green-600">Saved successfully</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button loading={saving} onClick={handleSave} disabled={!employee || isLoading}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        }
      >
        {isLoading && (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <LoadingSkeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-error">{error.message}</p>
            <Button variant="secondary" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        )}

        {employee && !isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" value={getValue('firstName')} onChange={set('firstName')} />
              <Input label="Last Name" value={getValue('lastName')} onChange={set('lastName')} />
            </div>
            <Input label="Email" type="email" value={getValue('email')} onChange={set('email')} />
            <Input label="Phone (E.164)" value={getValue('phoneE164')} onChange={set('phoneE164')} placeholder="+10001234567" />
            <Input label="Employee Code" value={getValue('employeeCode')} onChange={set('employeeCode')} />
            <div>
              <label className="text-sm font-semibold text-gray-800">{t('nav.branches')}</label>
              <select
                value={getValue('employeeBranchId')}
                onChange={(e) => setForm((f) => ({ ...f, employeeBranchId: e.target.value }))}
                disabled={branchesLoading}
                className="mt-1.5 h-[48px] w-full rounded-2xl border border-[#DDD6FE] bg-[#F9FAFF] px-4 text-sm text-gray-900 transition-all duration-200 focus:border-[#7C3AED] focus:shadow-[0_0_0_4px_rgba(124,58,237,0.12)] focus:outline-none disabled:opacity-50"
              >
                <option value="">{branchesLoading ? t('common.loading') : '—'}</option>
                {(branches ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.countryCode})
                  </option>
                ))}
              </select>
            </div>
            <Input label="New Password" type="password" value={getValue('password')} onChange={set('password')} placeholder="Leave blank to keep current" />

            {/* Role change section */}
            <div className="pt-2">
              <label className="text-sm font-medium text-on-surface">Role</label>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="flex-1 rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5 text-sm text-on-surface">
                  {employee.role}
                </span>
                <select
                  className="h-11 rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={rolesLoading || roleChanging}
                  onChange={(e) => e.target.value && setPendingRole(e.target.value)}
                  defaultValue=""
                >
                  <option value="">Change role…</option>
                  {roles.map((r, i) => (
                    <option key={r || `role-${i}`} value={r}>{r}</option>
                  ))}
                </select>
                {roleChanging && <Spinner className="h-4 w-4" />}
              </div>
            </div>
          </div>
        )}
      </FormDrawer>

      {/* Role change confirmation dialog */}
      <ConfirmDialog
        open={pendingRole !== null}
        onClose={() => setPendingRole(null)}
        onConfirm={handleRoleConfirm}
        loading={roleChanging}
        title="Change Role"
        message={`Change role to "${pendingRole}"? This will take effect immediately.`}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// View Employee Drawer (read-only details panel)
// ---------------------------------------------------------------------------
interface ViewDrawerProps {
  employeeId: string | null;
  open: boolean;
  onClose: () => void;
}

function ViewEmployeeDrawer({ employeeId, open, onClose }: ViewDrawerProps) {
  const { data: employee, isLoading, error, refetch } = useEmployeeDetails(employeeId ?? undefined);

  return (
    <FormDrawer open={open} onClose={onClose} title="Employee Details">
      {isLoading && (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-error">{error.message}</p>
          <Button variant="secondary" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      )}

      {employee && !isLoading && (
        <div className="space-y-5">
          <div className="rounded-xl bg-surface-container p-4">
            <p className="text-xl font-semibold text-on-surface">{employee.displayName}</p>
            <p className="mt-0.5 text-sm text-on-surface-variant">{employee.role}</p>
          </div>
          <dl className="space-y-3 text-sm">
            <DetailRow label="Employee Code" value={employee.employeeCode} />
            <DetailRow label="Email" value={employee.email} />
            <DetailRow label="Phone" value={employee.phoneE164} />
            <DetailRow label="Branch ID" value={employee.employeeBranchId} />
            {employee.branch && (
              <DetailRow label="Branch Name" value={employee.branch.name} />
            )}
            <DetailRow label="Created" value={formatDate(employee.createdAt)} />
          </dl>
        </div>
      )}
    </FormDrawer>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="min-w-[110px] text-on-surface-variant">{label}</dt>
      <dd className="text-end font-medium text-on-surface">{value || '—'}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main EmployeesPage
// ---------------------------------------------------------------------------

export function EmployeesPage() {
  const { t } = useTranslation();
  usePageTitle(t('employees.title'));

  const { items, isLoading, isFetchingMore, error, refetch, loadMore, hasMore } = useEmployees();

  // Drawer state
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteEmployee(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete employee');
      setDeleting(false);
    }
  }, [deleteTarget, refetch]);

  const columns = [
    {
      key: 'code',
      header: 'Employee Code',
      render: (row: Employee) => (
        <span className="font-mono text-sm text-primary">{row.employeeCode || '—'}</span>
      ),
    },
    {
      key: 'firstName',
      header: 'First Name',
      render: (row: Employee) => row.firstName,
    },
    {
      key: 'lastName',
      header: 'Last Name',
      render: (row: Employee) => row.lastName,
    },
    {
      key: 'email',
      header: 'Email',
      render: (row: Employee) => (
        <span className="text-on-surface-variant">{row.email}</span>
      ),
    },
    {
      key: 'branch',
      header: 'Branch ID',
      render: (row: Employee) => (
        <span className="font-mono text-xs text-on-surface-variant">
          {row.employeeBranchId ? row.employeeBranchId.slice(0, 8) + '…' : '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row: Employee) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (row: Employee) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            title="View"
            onClick={() => setViewId(row.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={t('common.edit')}
            onClick={() => setEditId(row.id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={t('common.delete')}
            className="text-error hover:bg-error/10"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('employees.title')}
        subtitle={t('employees.subtitle')}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            إضافة موظف
          </Button>
        }
      />

      <Card padding="none">
        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-sm text-error">{error.message}</p>
            <Button variant="secondary" onClick={refetch}>
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-outline-variant/40">
                  {['Employee Code', 'First Name', 'Last Name', 'Email', 'Branch ID', 'Created', 'Actions'].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-on-surface-variant">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                <SkeletonRows count={8} />
              </tbody>
            </table>
          </div>
        )}

        {/* Data table */}
        {!isLoading && !error && (
          <DataTable
            columns={columns}
            data={items}
            keyExtractor={(row) => row.id}
            emptyMessage="No employees found."
          />
        )}

        {/* Load More / Infinite scroll trigger */}
        {!isLoading && !error && hasMore && (
          <div className="flex justify-center border-t border-outline-variant/20 px-4 py-4">
            <Button variant="secondary" loading={isFetchingMore} onClick={loadMore}>
              {isFetchingMore ? 'Loading…' : 'Load More'}
            </Button>
          </div>
        )}

        {/* Fetching more indicator at bottom */}
        {isFetchingMore && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <tbody>
                <SkeletonRows count={4} />
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Drawer */}
      <CreateEmployeeDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => refetch()}
      />

      {/* View Drawer */}
      <ViewEmployeeDrawer
        key={viewId}
        employeeId={viewId}
        open={viewId !== null}
        onClose={() => setViewId(null)}
      />

      {/* Edit Drawer */}
      <EditEmployeeDrawer
        key={editId}
        employeeId={editId}
        open={editId !== null}
        onClose={() => setEditId(null)}
        onSaved={() => refetch()}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Delete Employee"
        message={
          deleteError
            ? `Error: ${deleteError}. Try again?`
            : `Delete "${deleteTarget?.displayName}"? This cannot be undone.`
        }
      />
    </div>
  );
}
