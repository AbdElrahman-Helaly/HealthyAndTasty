import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, RefreshCw, Building2, MapPin, Radio, Plus, Power, PowerOff } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FormDrawer } from '@/components/shared/FormDrawer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { createBranch, listBranches, updateBranch } from '@/api/branches.api';
import { PERMISSIONS } from '@/types/permissions';
import type { BranchAdmin } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/hooks/useToast';

function parseGoogleMapsCoordinates(value: string): { latitude: number; longitude: number } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    decoded = trimmed;
  }

  const numberPattern = '(-?\\d+(?:\\.\\d+)?)';
  const patterns = [
    new RegExp(`@${numberPattern},\\s*${numberPattern}`),
    new RegExp(`[?&](?:q|ll|query|center)=${numberPattern},\\s*${numberPattern}`),
    new RegExp(`!3d${numberPattern}!4d${numberPattern}`),
    new RegExp(`^${numberPattern},\\s*${numberPattern}$`),
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (!match) continue;

    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      return { latitude, longitude };
    }
  }

  return null;
}

interface AddBranchDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: (created: BranchAdmin) => void;
}

function AddBranchDrawer({ open, onClose, onCreated }: AddBranchDrawerProps) {
  const { show: showToast } = useToast();
  const [odooBranchId, setOdooBranchId] = useState(0);
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [mapsUrl, setMapsUrl] = useState('');
  const [mapsUrlError, setMapsUrlError] = useState('');
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(0);
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setOdooBranchId(0);
    setName('');
    setLatitude(0);
    setLongitude(0);
    setMapsUrl('');
    setMapsUrlError('');
    setDeliveryRadiusKm(0);
    setAddress('');
    setIsActive(true);
  };

  const handleClose = () => {
    if (!saving) {
      resetForm();
      onClose();
    }
  };
  const handleMapsUrlChange = (value: string) => {
    setMapsUrl(value);

    if (!value.trim()) {
      setMapsUrlError('');
      return;
    }

    const coordinates = parseGoogleMapsCoordinates(value);
    if (!coordinates) {
      setMapsUrlError('الرابط لا يحتوي على إحداثيات واضحة');
      return;
    }

    setLatitude(coordinates.latitude);
    setLongitude(coordinates.longitude);
    setMapsUrlError('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('اسم الفرع مطلوب', 'error');
      return;
    }

    setSaving(true);
    try {
      const created = await createBranch({
        odooBranchId,
        name: name.trim(),
        latitude,
        longitude,
        deliveryRadiusKm,
        address: address.trim(),
        isActive,
      });
      onCreated(created);
      showToast('تم إضافة الفرع', 'success');
      resetForm();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشل إضافة الفرع', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDrawer
      open={open}
      onClose={handleClose}
      title="إضافة فرع"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            إلغاء
          </Button>
          <Button loading={saving} onClick={() => void handleSave()}>
            إضافة
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="كود أودو"
          type="number"
          value={String(odooBranchId)}
          onChange={(e) => setOdooBranchId(parseInt(e.target.value, 10) || 0)}
        />
        <Input label="اسم الفرع" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="العنوان" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input
          label="رابط خرائط جوجل"
          placeholder="ضع رابط خرائط جوجل الكامل أو الإحداثيات"
          value={mapsUrl}
          onChange={(e) => handleMapsUrlChange(e.target.value)}
          error={mapsUrlError}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="خط العرض"
            type="number"
            step="any"
            value={String(latitude)}
            onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
          />
          <Input
            label="خط الطول"
            type="number"
            step="any"
            value={String(longitude)}
            onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
          />
        </div>
        <Input
          label="نطاق التوصيل (كم)"
          type="number"
          step="any"
          value={String(deliveryRadiusKm)}
          onChange={(e) => setDeliveryRadiusKm(parseFloat(e.target.value) || 0)}
        />
        <div className="flex items-center gap-3 pt-1">
          <input
            id="addBranchIsActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-outline-variant accent-primary"
          />
          <label htmlFor="addBranchIsActive" className="text-sm font-medium text-on-surface">
            نشط
          </label>
        </div>
      </div>
    </FormDrawer>
  );
}
interface EditBranchDrawerProps {
  branch: BranchAdmin | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: BranchAdmin) => void;
}

function EditBranchDrawer({ branch, open, onClose, onSaved }: EditBranchDrawerProps) {
  const { show: showToast } = useToast();
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [mapsUrl, setMapsUrl] = useState('');
  const [mapsUrlError, setMapsUrlError] = useState('');
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (branch) {
      setAddress(branch.address);
      setLatitude(branch.latitude);
      setLongitude(branch.longitude);
      setMapsUrl('');
      setMapsUrlError('');
      setDeliveryRadiusKm(branch.deliveryRadiusKm);
      setIsActive(branch.isActive);
    }
  }, [branch]);

  const handleMapsUrlChange = (value: string) => {
    setMapsUrl(value);

    if (!value.trim()) {
      setMapsUrlError('');
      return;
    }

    const coordinates = parseGoogleMapsCoordinates(value);
    if (!coordinates) {
      setMapsUrlError('الرابط لا يحتوي على إحداثيات واضحة');
      return;
    }

    setLatitude(coordinates.latitude);
    setLongitude(coordinates.longitude);
    setMapsUrlError('');
  };

  const handleSave = async () => {
    if (!branch) return;

    const branchId = Number(branch.id);
    const updateId = Number.isFinite(branchId) ? branchId : branch.odooBranchId;

    setSaving(true);
    try {
      const updated = await updateBranch(updateId, {
        latitude,
        longitude,
        deliveryRadiusKm,
        address: address.trim(),
        isActive,
      });
      onSaved(updated);
      showToast('تم تحديث بيانات الفرع', 'success');
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشل تحديث الفرع', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title="تعديل الفرع"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
          <Button loading={saving} onClick={() => void handleSave()}>
            حفظ
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-primary-surface px-3 py-2 text-sm">
          <p className="font-medium text-on-surface">{branch?.name}</p>
          <p className="mt-1 text-on-surface-variant">
            كود أودو: <span className="font-mono font-medium text-primary">{branch?.odooBranchId}</span>
          </p>
        </div>
        <Input label="العنوان" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input
          label="رابط خرائط جوجل"
          placeholder="ضع رابط خرائط جوجل الكامل أو الإحداثيات"
          value={mapsUrl}
          onChange={(e) => handleMapsUrlChange(e.target.value)}
          error={mapsUrlError}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="خط العرض"
            type="number"
            step="any"
            value={String(latitude)}
            onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
          />
          <Input
            label="خط الطول"
            type="number"
            step="any"
            value={String(longitude)}
            onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
          />
        </div>
        <Input
          label="نطاق التوصيل (كم)"
          type="number"
          step="any"
          value={String(deliveryRadiusKm)}
          onChange={(e) => setDeliveryRadiusKm(parseFloat(e.target.value) || 0)}
        />
        <div className="flex items-center gap-3 pt-1">
          <input
            id="isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-outline-variant accent-primary"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-on-surface">
            نشط
          </label>
        </div>
      </div>
    </FormDrawer>
  );
}
export function BranchesPage() {
  const { t } = useTranslation();
  const { show: showToast } = useToast();
  const [branches, setBranches] = useState<BranchAdmin[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editTarget, setEditTarget] = useState<BranchAdmin | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [togglingBranchId, setTogglingBranchId] = useState<string | null>(null);
  usePageTitle(t('branches.title'));

  const load = useCallback(async () => {
    setError('');
    try {
      setBranches(await listBranches());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الفروع');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return branches.filter((b) => {
      const matchSearch =
        b.name.toLowerCase().includes(q) ||
        String(b.odooBranchId).includes(q) ||
        b.address.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && b.isActive) ||
        (statusFilter === 'inactive' && !b.isActive);
      return matchSearch && matchStatus;
    });
  }, [branches, search, statusFilter]);
  const handleToggleActive = useCallback(async (branch: BranchAdmin) => {
    const branchId = Number(branch.id);
    const updateId = Number.isFinite(branchId) ? branchId : branch.odooBranchId;

    setTogglingBranchId(branch.id);
    try {
      const updated = await updateBranch(updateId, {
        latitude: branch.latitude,
        longitude: branch.longitude,
        deliveryRadiusKm: branch.deliveryRadiusKm,
        address: branch.address,
        isActive: !branch.isActive,
      });
      setBranches((prev) => prev.map((b) => (b.id === branch.id ? updated : b)));
      showToast(updated.isActive ? 'تم تفعيل الفرع' : 'تم إيقاف الفرع', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشل تغيير حالة الفرع', 'error');
    } finally {
      setTogglingBranchId(null);
    }
  }, [showToast]);

  const columns = useMemo<Column<BranchAdmin>[]>(
    () => [
      {
        key: 'name',
        header: 'الفرع',
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-surface text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-on-surface">{row.name}</p>
              <p className="text-[11px] text-on-surface-variant/60 font-mono">أودو #{row.odooBranchId}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'address',
        header: 'العنوان',
        render: (row) => (
          <span className="flex items-center gap-1.5 text-on-surface-variant/80">
            <MapPin className="h-3.5 w-3.5" />
            {row.address || '—'}
          </span>
        ),
      },
      {
        key: 'deliveryRadiusKm',
        header: 'نطاق التوصيل',
        render: (row) => (
          <span className="flex items-center gap-1.5 text-on-surface-variant/80">
            <Radio className="h-3.5 w-3.5" />
            {row.deliveryRadiusKm} كم
          </span>
        ),
      },
      {
        key: 'status',
        header: 'الحالة',
        render: (row) => <StatusBadge active={row.isActive} />,
      },
      {
        key: 'createdAt',
        header: 'تاريخ الإنشاء',
        render: (row) => (
          <span className="text-xs text-on-surface-variant/60">
            {new Date(row.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'إجراءات',
        render: (row) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <PermissionGate permission={PERMISSIONS.BranchesManage}>
              <Button
                variant="ghost"
                size="icon"
                title="تعديل"
                onClick={() => setEditTarget(row)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant={row.isActive ? 'danger' : 'success'}
                size="icon"
                title={row.isActive ? 'إيقاف النشاط' : 'تفعيل النشاط'}
                loading={togglingBranchId === row.id}
                onClick={() => void handleToggleActive(row)}
              >
                {row.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
              </Button>
            </PermissionGate>
          </div>
        ),
      },
    ],
    [handleToggleActive, togglingBranchId],
  );

  return (
    <div>
      <PageHeader
        title={t('branches.title')}
        subtitle={t('branches.subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PermissionGate permission={PERMISSIONS.BranchesManage}>
              <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                إضافة فرع
              </Button>
            </PermissionGate>
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </div>
        }
      />

      <Card padding="md" className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="بحث" placeholder="اسم الفرع أو العنوان" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select label="الحالة" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">الكل</option>
            <option value="active">نشط</option>
            <option value="inactive">موقوف</option>
          </Select>
        </div>
      </Card>

      <Card padding="none">
        {error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-on-surface-variant">{error}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => void load()}>
              إعادة المحاولة
            </Button>
          </div>
        )}
        {!error && (
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(row) => row.id}
            emptyMessage="لا توجد فروع"
          />
        )}
      </Card>

      <AddBranchDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(created) => setBranches((prev) => [created, ...prev])}
      />

      <EditBranchDrawer
        key={editTarget?.id}
        branch={editTarget}
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        onSaved={(updated) => setBranches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))}
      />
    </div>
  );
}
