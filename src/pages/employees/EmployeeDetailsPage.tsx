import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { DetailLayout } from '@/components/shared/DetailLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/Modal';
import { FormDrawer } from '@/components/shared/FormDrawer';
import { useEmployeeDetails, useRoles } from '@/hooks/useEmployeeDetails';
import { updateEmployee, deleteEmployee, changeUserRole } from '@/services/employee.service';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatDate } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { EmployeeUpdateRequest } from '@/types';

export function EmployeeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: employee, isLoading, error, refetch } = useEmployeeDetails(id);
  usePageTitle(employee?.displayName ?? t('employees.details'));

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<Partial<EmployeeUpdateRequest>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: roles, isLoading: rolesLoading } = useRoles();

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Role change state
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [roleChanging, setRoleChanging] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

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
    if (!id || !employee) return;
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

      await updateEmployee(id, payload);
      setForm({});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setEditOpen(false);
      refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteEmployee(id);
      navigate('/employees');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  };

  const handleRoleConfirm = async () => {
    if (!employee || !pendingRole) return;
    setRoleChanging(true);
    setRoleError(null);
    try {
      await changeUserRole(employee.userId, pendingRole);
      setPendingRole(null);
      refetch();
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : 'Failed to change role');
      setPendingRole(null);
    } finally {
      setRoleChanging(false);
    }
  };

  // Loading state
  if (isLoading) return <PageLoader />;

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-sm text-error">{error.message}</p>
        <Button variant="secondary" onClick={refetch}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  // Not found
  if (!employee) {
    return <p className="py-12 text-center text-on-surface-variant">Employee not found.</p>;
  }

  return (
    <>
      <DetailLayout
        title={employee.displayName}
        subtitle={`${employee.employeeCode} · ${employee.role}`}
        backHref="/employees"
        backLabel={t('common.back')}
        actions={
          <div className="flex gap-2">
            {saveSuccess && <span className="self-center text-sm text-green-600">Saved</span>}
            <Button size="sm" variant="secondary" onClick={() => { setForm({}); setEditOpen(true); }}>
              <Pencil className="h-4 w-4" /> {t('common.edit')}
            </Button>
            <Button size="sm" variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" /> {t('common.delete')}
            </Button>
          </div>
        }
        sections={[
          {
            id: 'profile',
            label: t('employees.profile'),
            content: (
              <Card>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-xs text-on-surface-variant">First Name</p>
                    <p className="mt-1 font-medium">{employee.firstName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Last Name</p>
                    <p className="mt-1 font-medium">{employee.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Email</p>
                    <p className="mt-1 font-medium">{employee.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Phone</p>
                    <p className="mt-1 font-medium">{employee.phoneE164 || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Employee Code</p>
                    <p className="mt-1 font-mono font-medium text-primary">{employee.employeeCode || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Created</p>
                    <p className="mt-1 font-medium">{formatDate(employee.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Role</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-medium">{employee.role}</span>
                      {roleError && <span className="text-xs text-error">{roleError}</span>}
                      <select
                        className="h-8 rounded-lg border border-outline-variant bg-surface px-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                        disabled={rolesLoading || roleChanging}
                        onChange={(e) => e.target.value && setPendingRole(e.target.value)}
                        defaultValue=""
                      >
                        <option value="">Change…</option>
                        {roles.map((r, i) => (
                          <option key={r || `role-${i}`} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </Card>
            ),
          },
          {
            id: 'branch',
            label: 'Branch',
            content: employee.branch ? (
              <Card>
                <Link
                  to={`/branches/${employee.branch.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {employee.branch.name}
                </Link>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {employee.branch.code} · {employee.branch.countryName}
                </p>
              </Card>
            ) : (
              <Card>
                <p className="text-sm text-on-surface-variant">
                  Branch ID: <span className="font-mono">{employee.employeeBranchId || '—'}</span>
                </p>
              </Card>
            ),
          },
        ]}
      />

      {/* Edit Drawer */}
      <FormDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`${t('common.edit')} Employee`}
        footer={
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">
              {saveError && <span className="text-error">{saveError}</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(false)}>
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
            <Input label="First Name" value={getValue('firstName')} onChange={set('firstName')} />
            <Input label="Last Name" value={getValue('lastName')} onChange={set('lastName')} />
          </div>
          <Input label="Email" type="email" value={getValue('email')} onChange={set('email')} />
          <Input label="Phone (E.164)" value={getValue('phoneE164')} onChange={set('phoneE164')} />
          <Input label="Employee Code" value={getValue('employeeCode')} onChange={set('employeeCode')} />
          <Input label="Branch ID" value={getValue('employeeBranchId')} onChange={set('employeeBranchId')} />
          <Input
            label="New Password"
            type="password"
            value={getValue('password')}
            onChange={set('password')}
            placeholder="Leave blank to keep current"
          />
        </div>
      </FormDrawer>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteError(null); }}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Employee"
        message={
          deleteError
            ? `Error: ${deleteError}. Try again?`
            : `Delete "${employee.displayName}"? This cannot be undone.`
        }
      />

      {/* Role change confirmation */}
      <ConfirmDialog
        open={pendingRole !== null}
        onClose={() => setPendingRole(null)}
        onConfirm={handleRoleConfirm}
        loading={roleChanging}
        title="Change Role"
        message={`Change "${employee.displayName}"'s role to "${pendingRole}"? This takes effect immediately.`}
      />
    </>
  );
}
