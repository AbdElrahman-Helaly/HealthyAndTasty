import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, RefreshCw, Eye, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { SearchFilters, SelectFilter } from '@/components/shared/SearchFilters';
import { FormDrawer } from '@/components/shared/FormDrawer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/Badge';
import { LoadingSkeleton } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useBranches } from '@/hooks/useBranchDetails';
import { useCountries } from '@/hooks/useCountries';
import { usePageTitle } from '@/hooks/usePageTitle';
import { createBranch, updateBranch, deleteBranch } from '@/services/branch.service';
import type { Branch, CreateBranchRequest, UpdateBranchRequest } from '@/types';

// ---------------------------------------------------------------------------
// Create Branch Drawer
// ---------------------------------------------------------------------------

interface CreateBranchDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateBranchDrawer({ open, onClose, onCreated }: CreateBranchDrawerProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Partial<CreateBranchRequest>>({ country: 'EG' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set =
    (field: keyof CreateBranchRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === 'latitude' || field === 'longitude'
          ? parseFloat(e.target.value) || 0
          : e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
    };

  const handleSave = async () => {
    const { code, name, country, latitude, longitude } = form;
    if (!code || !name || !country || latitude === undefined || longitude === undefined) {
      setError('All fields are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createBranch({ code, name, country, latitude, longitude });
      setSuccess(true);
      setForm({ country: 'EG' });
      setTimeout(() => setSuccess(false), 3000);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create branch');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm({ country: 'EG' });
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <FormDrawer
      open={open}
      onClose={handleClose}
      title={t('common.create') + ' Branch'}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            {error && <span className="text-error">{error}</span>}
            {success && <span className="text-green-600">Branch created!</span>}
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
        <Input
          label="Branch Code"
          value={form.code ?? ''}
          onChange={set('code')}
          placeholder="e.g. EG-CAI-01"
        />
        <Input
          label="Branch Name"
          value={form.name ?? ''}
          onChange={set('name')}
          placeholder="e.g. Cairo Downtown"
        />
        <Select
          label="Country Code"
          value={form.country ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
        >
          <option value="EG">Egypt</option>
          <option value="SA">Saudi Arabia</option>
          <option value="AE">UAE</option>
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Latitude"
            type="number"
            step="any"
            value={form.latitude !== undefined ? String(form.latitude) : ''}
            onChange={set('latitude')}
            placeholder="30.0444"
          />
          <Input
            label="Longitude"
            type="number"
            step="any"
            value={form.longitude !== undefined ? String(form.longitude) : ''}
            onChange={set('longitude')}
            placeholder="31.2357"
          />
        </div>
      </div>
    </FormDrawer>
  );
}

// ---------------------------------------------------------------------------
// Edit Branch Drawer
// ---------------------------------------------------------------------------

interface EditBranchDrawerProps {
  branch: Branch | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function EditBranchDrawer({ branch, open, onClose, onSaved }: EditBranchDrawerProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Partial<UpdateBranchRequest>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const getValue = (field: keyof UpdateBranchRequest): string | number | boolean => {
    if (form[field] !== undefined) return form[field] as string | number | boolean;
    if (!branch) return '';
    const map: Record<keyof UpdateBranchRequest, string | number | boolean> = {
      name: branch.name,
      latitude: branch.latitude,
      longitude: branch.longitude,
      isActive: branch.isActive,
    };
    return map[field];
  };

  const setField =
    (field: keyof UpdateBranchRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === 'latitude' || field === 'longitude'
          ? parseFloat(e.target.value) || 0
          : field === 'isActive'
          ? e.target.checked
          : e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
    };

  const handleSave = async () => {
    if (!branch) return;
    setSaving(true);
    setError(null);
    try {
      const payload: UpdateBranchRequest = {
        name: String(getValue('name')),
        latitude: Number(getValue('latitude')),
        longitude: Number(getValue('longitude')),
        isActive: Boolean(getValue('isActive')),
      };
      await updateBranch(branch.id, payload);
      setSuccess(true);
      setForm({});
      setTimeout(() => setSuccess(false), 3000);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branch');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm({});
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <FormDrawer
      open={open}
      onClose={handleClose}
      title={`${t('common.edit')} Branch`}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            {error && <span className="text-error">{error}</span>}
            {success && <span className="text-green-600">Saved!</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button loading={saving} onClick={handleSave} disabled={!branch}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      }
    >
      {branch && (
        <div className="space-y-4">
          <div className="rounded-lg bg-surface-container px-3 py-2 text-sm">
            <span className="text-on-surface-variant">Code: </span>
            <span className="font-mono font-medium text-primary">{branch.code}</span>
          </div>
          <Input
            label="Branch Name"
            value={String(getValue('name'))}
            onChange={setField('name')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={String(getValue('latitude'))}
              onChange={setField('latitude')}
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              value={String(getValue('longitude'))}
              onChange={setField('longitude')}
            />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <input
              id="isActive"
              type="checkbox"
              checked={Boolean(getValue('isActive'))}
              onChange={setField('isActive')}
              className="h-4 w-4 rounded border-outline-variant accent-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-on-surface">
              Active
            </label>
          </div>
        </div>
      )}
    </FormDrawer>
  );
}

// ---------------------------------------------------------------------------
// Main BranchesPage
// ---------------------------------------------------------------------------

export function BranchesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  usePageTitle(t('branches.title'));

  const { data: countries } = useCountries();
  const [countryFilter, setCountryFilter] = useState('');
  const { data: branches, isLoading, error, refetch } = useBranches(countryFilter || undefined);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Drawer state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Branch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!branches) return [];
    return branches.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch =
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.countryName.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && b.isActive) ||
        (statusFilter === 'inactive' && !b.isActive);
      return matchSearch && matchStatus;
    });
  }, [branches, search, statusFilter]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteBranch(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete branch');
      setDeleting(false);
    }
  }, [deleteTarget, refetch]);

  const countryOptions = useMemo(() => {
    const opts = [{ value: '', label: 'All Countries' }];
    if (countries) {
      countries.forEach((c) => opts.push({ value: c.code, label: c.name }));
    }
    return opts;
  }, [countries]);

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (row: Branch) => (
        <span className="font-mono text-sm text-primary">{row.code}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row: Branch) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'country',
      header: 'Country',
      render: (row: Branch) => row.countryName || row.countryCode,
    },
    {
      key: 'employees',
      header: 'Employees',
      render: (row: Branch) => (
        <span className="tabular-nums">{row.employeeCount ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row: Branch) => <StatusBadge active={row.isActive} />,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (row: Branch) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            title="View"
            onClick={() => navigate(`/branches/${row.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={t('common.edit')}
            onClick={() => setEditTarget(row)}
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
        title={t('branches.title')}
        subtitle={t('branches.subtitle')}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('common.create')} Branch
          </Button>
        }
      />

      <Card>
        <SearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or code…"
        >
          <SelectFilter
            label="Country"
            value={countryFilter}
            onChange={setCountryFilter}
            options={countryOptions}
          />
          <SelectFilter
            label={t('common.status')}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: t('common.all') },
              { value: 'active', label: t('common.active') },
              { value: 'inactive', label: t('common.inactive') },
            ]}
          />
        </SearchFilters>

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
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => navigate(`/branches/${row.id}`)}
            emptyMessage="No branches found."
          />
        )}
      </Card>

      {/* Create drawer */}
      <CreateBranchDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refetch}
      />

      {/* Edit drawer */}
      <EditBranchDrawer
        key={editTarget?.id}
        branch={editTarget}
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        onSaved={refetch}
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
        title="Delete Branch"
        message={
          deleteError
            ? `Error: ${deleteError}. Try again?`
            : `Delete "${deleteTarget?.name}"? This action cannot be undone.`
        }
      />
    </div>
  );
}
