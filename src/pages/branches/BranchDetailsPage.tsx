import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Plus, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { DetailLayout } from '@/components/shared/DetailLayout';
import { DataTable } from '@/components/shared/DataTable';
import { FormDrawer } from '@/components/shared/FormDrawer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { PageLoader, LoadingSkeleton, Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/Modal';
import {
  useBranchDetails,
  useBranchEmployees,
  useBranchEmployeeRoles,
} from '@/hooks/useBranchDetails';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  createBranchEmployee,
  changeBranchEmployeeRole,
  updateBranch,
} from '@/services/branch.service';
import { formatDate } from '@/lib/utils';
import type { BranchEmployee, CreateBranchEmployeeRequest } from '@/types';

// ---------------------------------------------------------------------------
// Add Employee Drawer
// ---------------------------------------------------------------------------

interface AddEmployeeDrawerProps {
  branchId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function AddEmployeeDrawer({ branchId, open, onClose, onCreated }: AddEmployeeDrawerProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Omit<CreateBranchEmployeeRequest, 'branchId'>>({
    employeeCode: '',
    password: '',
    displayName: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set =
    (field: keyof Omit<CreateBranchEmployeeRequest, 'branchId'>) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.displayName || !form.employeeCode || !form.password) {
      setError('All fields are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createBranchEmployee({ branchId, ...form });
      setSuccess(true);
      setForm({ employeeCode: '', password: '', displayName: '' });
      setTimeout(() => setSuccess(false), 3000);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm({ employeeCode: '', password: '', displayName: '' });
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <FormDrawer
      open={open}
      onClose={handleClose}
      title="Add Employee"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            {error && <span className="text-error">{error}</span>}
            {success && <span className="text-green-600">Employee created!</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button loading={saving} onClick={handleSave}>
              {t('common.create')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Branch is preselected — show it read-only */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-on-surface">Branch</p>
          <div className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5 text-sm text-on-surface-variant">
            {branchId}
          </div>
        </div>
        <Input
          label="Display Name"
          value={form.displayName}
          onChange={set('displayName')}
          placeholder="e.g. Ahmed Hassan"
        />
        <Input
          label="Employee Code"
          value={form.employeeCode}
          onChange={set('employeeCode')}
          placeholder="e.g. EMP-001"
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={set('password')}
          placeholder="Temporary password"
        />
      </div>
    </FormDrawer>
  );
}

// ---------------------------------------------------------------------------
// Branch Employees Section
// ---------------------------------------------------------------------------

interface BranchEmployeesSectionProps {
  branchId: string;
}

function BranchEmployeesSection({ branchId }: BranchEmployeesSectionProps) {
  const { data, isLoading, error, refetch, page, setPage, pageSize } =
    useBranchEmployees(branchId);
  const { data: roles } = useBranchEmployeeRoles();

  const [addOpen, setAddOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<{
    employee: BranchEmployee;
    role: string;
  } | null>(null);
  const [roleChanging, setRoleChanging] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const handleRoleConfirm = async () => {
    if (!pendingRole) return;
    setRoleChanging(true);
    setRoleError(null);
    try {
      await changeBranchEmployeeRole(pendingRole.employee.id, {
        roleName: pendingRole.role,
      });
      setPendingRole(null);
      refetch();
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : 'Failed to change role');
      setPendingRole(null);
    } finally {
      setRoleChanging(false);
    }
  };

  const employees = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (row: BranchEmployee) => (
        <span className="font-mono text-sm text-primary">{row.employeeCode || '—'}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row: BranchEmployee) => (
        <span className="font-medium">{row.displayName || '—'}</span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row: BranchEmployee) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="text-sm">{row.roleName}</span>
          {roleError && <span className="text-xs text-error">{roleError}</span>}
          <select
            className="h-8 rounded-lg border border-outline-variant bg-surface px-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={roleChanging}
            onChange={(e) =>
              e.target.value && setPendingRole({ employee: row, role: e.target.value })
            }
            defaultValue=""
          >
            <option value="">Change…</option>
            {roles.map((r, i) => (
              <option key={r.name || `role-${i}`} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
          {roleChanging && <Spinner className="h-4 w-4" />}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: BranchEmployee) => <StatusBadge active={row.isActive} />,
    },
    {
      key: 'created',
      header: 'Created',
      render: (row: BranchEmployee) => formatDate(row.createdAt),
    },
  ];

  return (
    <>
      <Card padding="none">
        {/* Section header */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-on-surface">
              Employees
            </span>
            {total > 0 && (
              <span className="rounded-full bg-primary-surface px-2 py-0.5 text-xs font-medium text-primary">
                {total}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={refetch} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && !isLoading && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-error">{error.message}</p>
            <Button variant="secondary" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <DataTable
            columns={columns}
            data={employees}
            keyExtractor={(row) => row.id}
            emptyMessage="No employees in this branch yet."
          />
        )}

        {/* Pagination */}
        {!isLoading && !error && total > pageSize && (
          <div className="flex items-center justify-between border-t border-outline-variant/20 px-5 py-3 text-sm text-on-surface-variant">
            <span>
              Page {page} of {totalPages} ({total} total)
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add Employee Drawer */}
      <AddEmployeeDrawer
        branchId={branchId}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={refetch}
      />

      {/* Role Change Confirmation */}
      <ConfirmDialog
        open={pendingRole !== null}
        onClose={() => setPendingRole(null)}
        onConfirm={handleRoleConfirm}
        loading={roleChanging}
        title="Change Role"
        message={`Change "${pendingRole?.employee.displayName}"'s role to "${pendingRole?.role}"? This takes effect immediately.`}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Edit Branch Drawer (inline in details page)
// ---------------------------------------------------------------------------

interface EditBranchInlineProps {
  branch: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    isActive: boolean;
    code: string;
  };
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function EditBranchInline({ branch, open, onClose, onSaved }: EditBranchInlineProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: branch.name,
    latitude: branch.latitude,
    longitude: branch.longitude,
    isActive: branch.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateBranch(branch.id, {
        name: form.name,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        isActive: form.isActive,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branch');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={`${t('common.edit')} Branch`}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">{error && <span className="text-error">{error}</span>}</div>
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
        <div className="rounded-lg bg-surface-container px-3 py-2 text-sm">
          <span className="text-on-surface-variant">Code: </span>
          <span className="font-mono font-medium text-primary">{branch.code}</span>
        </div>
        <Input
          label="Branch Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Latitude"
            type="number"
            step="any"
            value={String(form.latitude)}
            onChange={(e) =>
              setForm((f) => ({ ...f, latitude: parseFloat(e.target.value) || 0 }))
            }
          />
          <Input
            label="Longitude"
            type="number"
            step="any"
            value={String(form.longitude)}
            onChange={(e) =>
              setForm((f) => ({ ...f, longitude: parseFloat(e.target.value) || 0 }))
            }
          />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <input
            id="edit-isActive"
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="h-4 w-4 rounded border-outline-variant accent-primary"
          />
          <label htmlFor="edit-isActive" className="text-sm font-medium text-on-surface">
            Active
          </label>
        </div>
      </div>
    </FormDrawer>
  );
}

// ---------------------------------------------------------------------------
// Main BranchDetailsPage
// ---------------------------------------------------------------------------

export function BranchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: branch, isLoading, error, refetch } = useBranchDetails(id);
  usePageTitle(branch?.name ?? t('branches.details'));

  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <PageLoader />;

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

  if (!branch) {
    return (
      <p className="py-12 text-center text-on-surface-variant">Branch not found.</p>
    );
  }

  return (
    <>
      <DetailLayout
        title={branch.name}
        subtitle={`${branch.code} · ${branch.countryName || branch.countryCode}`}
        backHref="/branches"
        backLabel={t('common.back')}
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" /> {t('common.edit')}
            </Button>
          </div>
        }
        sections={[
          {
            id: 'info',
            label: t('branches.information'),
            content: (
              <Card>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-xs text-on-surface-variant">Code</p>
                    <p className="mt-1 font-mono font-medium text-primary">{branch.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Name</p>
                    <p className="mt-1 font-medium">{branch.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Country</p>
                    <p className="mt-1 font-medium">
                      {branch.countryName || branch.countryCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Latitude</p>
                    <p className="mt-1 font-medium tabular-nums">{branch.latitude}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Longitude</p>
                    <p className="mt-1 font-medium tabular-nums">{branch.longitude}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">{t('common.status')}</p>
                    <div className="mt-1">
                      <StatusBadge active={branch.isActive} />
                    </div>
                  </div>
                  {branch.employeeCount !== undefined && (
                    <div>
                      <p className="text-xs text-on-surface-variant">Employee Count</p>
                      <p className="mt-1 font-medium tabular-nums">{branch.employeeCount}</p>
                    </div>
                  )}
                </div>
              </Card>
            ),
          },
          {
            id: 'employees',
            label: t('nav.employees'),
            content: <BranchEmployeesSection branchId={branch.id} />,
          },
        ]}
      />

      {/* Edit Drawer */}
      <EditBranchInline
        key={branch.id}
        branch={branch}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          refetch();
        }}
      />
    </>
  );
}
