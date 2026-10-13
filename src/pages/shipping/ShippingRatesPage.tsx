import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, RefreshCw, Truck } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { listBranches } from '@/api/branches.api';
import {
  createShippingRate,
  deleteShippingRate,
  listShippingRates,
  updateShippingRate,
} from '@/api/shippingRates.api';
import { formatCurrency } from '@/config/orderStatus';
import type { BranchAdmin, ShippingRate } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const MANAGER_ROLES = ['admin', 'generalmanager'];

function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none',
        checked ? 'bg-emerald-500' : 'bg-gray-300',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200',
          checked ? 'start-[22px]' : 'start-0.5',
        )}
      />
    </button>
  );
}

interface RateFormModalProps {
  open: boolean;
  rate: ShippingRate | null;
  branches: BranchAdmin[];
  onClose: () => void;
  onSaved: (rate: ShippingRate) => void;
}

function RateFormModal({ open, rate, branches, onClose, onSaved }: RateFormModalProps) {
  const { show: showToast } = useToast();
  const [branchId, setBranchId] = useState('');
  const [minDistanceKm, setMinDistanceKm] = useState('');
  const [maxDistanceKm, setMaxDistanceKm] = useState('');
  const [baseFee, setBaseFee] = useState('');
  const [pricePerKm, setPricePerKm] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setBranchId(rate?.branchId ?? '');
    setMinDistanceKm(rate ? String(rate.minDistanceKm) : '');
    setMaxDistanceKm(rate ? String(rate.maxDistanceKm) : '');
    setBaseFee(rate ? String(rate.baseFee) : '');
    setPricePerKm(rate ? String(rate.pricePerKm) : '');
    setIsActive(rate?.isActive ?? true);
    setErrors({});
  }, [open, rate]);

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!branchId) nextErrors.branchId = 'الفرع مطلوب';
    const min = parseFloat(minDistanceKm);
    const max = parseFloat(maxDistanceKm);
    const fee = parseFloat(baseFee);
    const price = parseFloat(pricePerKm);
    if (Number.isNaN(min) || min < 0) nextErrors.minDistanceKm = 'من يجب أن تكون قيمة أكبر من أو تساوي 0';
    if (Number.isNaN(max)) nextErrors.maxDistanceKm = 'إلى مطلوبة';
    if (!Number.isNaN(min) && !Number.isNaN(max) && max <= min)
      nextErrors.maxDistanceKm = 'إلى يجب أن تكون أكبر من من';
    if (Number.isNaN(fee) || fee < 0) nextErrors.baseFee = 'الرسوم الأساسية يجب أن تكون أكبر من أو تساوي 0';
    if (Number.isNaN(price) || price < 0) nextErrors.pricePerKm = 'سعر الكيلومتر يجب أن يكون أكبر من أو يساوي 0';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const body = {
        branchId,
        minDistanceKm: min,
        maxDistanceKm: max,
        baseFee: fee,
        pricePerKm: price,
        isActive,
      };
      const saved = rate
        ? await updateShippingRate(rate.id, body)
        : await createShippingRate(body);
      onSaved(saved);
      showToast(rate ? 'تم التحديث بنجاح' : 'تمت الإضافة بنجاح', 'success');
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشلت العملية', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={rate ? 'تعديل شريحة أسعار التوصيل' : 'إضافة شريحة أسعار التوصيل'}
      size="lg"
    >
      <div className="flex flex-col gap-4">
        <Select
          label="الفرع"
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          error={errors.branchId}
        >
          <option value="">اختر الفرع...</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="من (كم)"
            type="number"
            min={0}
            step="any"
            placeholder="0"
            value={minDistanceKm}
            onChange={(e) => setMinDistanceKm(e.target.value)}
            error={errors.minDistanceKm}
          />
          <Input
            label="إلى (كم)"
            type="number"
            min={0}
            step="any"
            placeholder="5"
            value={maxDistanceKm}
            onChange={(e) => setMaxDistanceKm(e.target.value)}
            error={errors.maxDistanceKm}
          />
          <div className="flex flex-col gap-1.5">
            <Input
              label="الرسوم الأساسية"
              type="number"
              min={0}
              step="any"
              placeholder="10"
              value={baseFee}
              onChange={(e) => setBaseFee(e.target.value)}
              error={errors.baseFee}
            />
            <p className="text-xs text-on-surface-variant/70">رقم ثابت بيتحسب مع الأوردر.</p>
          </div>
          <Input
            label="سعر الكيلومتر"
            type="number"
            min={0}
            step="any"
            placeholder="4"
            value={pricePerKm}
            onChange={(e) => setPricePerKm(e.target.value)}
            error={errors.pricePerKm}
          />
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface-container px-4 py-3">
          <div>
            <p className="text-sm font-medium text-on-surface">نشط</p>
            <p className="text-xs text-on-surface-variant/70">تطبق هذه الشريحة في حساب تكلفة التوصيل</p>
          </div>
          <Switch checked={isActive} onChange={setIsActive} />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button loading={saving} onClick={() => void handleSubmit()}>
            {rate ? 'حفظ التعديلات' : 'إضافة الشريحة'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function ShippingRatesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { show: showToast } = useToast();
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [branches, setBranches] = useState<BranchAdmin[]>([]);
  const [branchFilter, setBranchFilter] = useState('');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  const [deletingRate, setDeletingRate] = useState<ShippingRate | null>(null);
  const [deleting, setDeleting] = useState(false);
  usePageTitle(t('shippingRates.title'));

  const canManage = useMemo(() => {
    const role = (user?.role ?? '').toLowerCase();
    return MANAGER_ROLES.includes(role);
  }, [user?.role]);

  const resolveBranchName = useCallback(
    (branchId: string) => branches.find((b) => b.id === branchId)?.name ?? '',
    [branches],
  );

  const load = useCallback(async () => {
    setError('');
    try {
      const [rateList, branchList] = await Promise.all([
        listShippingRates(branchFilter || undefined),
        listBranches(),
      ]);
      setRates(rateList);
      setBranches(branchList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل أسعار التوصيل');
    }
  }, [branchFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyMutation = useCallback(
    (rate: ShippingRate) => {
      const matchesFilter = !branchFilter || rate.branchId === branchFilter;
      if (matchesFilter) {
        setRates((prev) => {
          const exists = prev.some((r) => r.id === rate.id);
          return exists
            ? prev.map((r) => (r.id === rate.id ? { ...rate, branchName: rate.branchName || resolveBranchName(rate.branchId) || r.branchName } : r))
            : [...prev, { ...rate, branchName: rate.branchName || resolveBranchName(rate.branchId) }];
        });
      } else if (rate.branchId !== branchFilter) {
        setRates((prev) => prev.filter((r) => r.id !== rate.id));
      }
    },
    [branchFilter, resolveBranchName],
  );

  const handleToggle = async (rate: ShippingRate) => {
    try {
      const updated = await updateShippingRate(rate.id, {
        branchId: rate.branchId,
        minDistanceKm: rate.minDistanceKm,
        maxDistanceKm: rate.maxDistanceKm,
        baseFee: rate.baseFee,
        pricePerKm: rate.pricePerKm,
        isActive: !rate.isActive,
      });
      setRates((prev) => prev.map((r) => (r.id === rate.id ? updated : r)));
      showToast('تم التحديث بنجاح', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشل التحديث', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingRate) return;
    setDeleting(true);
    try {
      await deleteShippingRate(deletingRate.id);
      setRates((prev) => prev.filter((r) => r.id !== deletingRate.id));
      showToast('تم الحذف بنجاح', 'success');
      setDeletingRate(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشل الحذف', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<Column<ShippingRate>[]>(
    () => [
      {
        key: 'branchName',
        header: 'الفرع',
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-surface text-primary">
              <Truck className="h-4 w-4" />
            </div>
            <p className="font-medium text-on-surface">{row.branchName || '—'}</p>
          </div>
        ),
      },
      {
        key: 'minDistanceKm',
        header: 'من (كم)',
        render: (row) => (
          <span className="font-mono text-sm text-on-surface-variant/90">
            {Number(row.minDistanceKm).toLocaleString('en-US')}
          </span>
        ),
      },
      {
        key: 'maxDistanceKm',
        header: 'إلى (كم)',
        render: (row) => (
          <span className="font-mono text-sm text-on-surface-variant/90">
            {Number(row.maxDistanceKm).toLocaleString('en-US')}
          </span>
        ),
      },
      {
        key: 'baseFee',
        header: 'الرسوم الأساسية',
        render: (row) => <span className="font-mono text-sm font-semibold text-on-surface">{formatCurrency(row.baseFee)}</span>,
      },
      {
        key: 'pricePerKm',
        header: 'سعر الكيلومتر',
        render: (row) => (
          <span className="font-mono text-sm text-on-surface-variant/90">
            {Number(row.pricePerKm).toLocaleString('en-US', { maximumFractionDigits: 4 })} ر.س/كم
          </span>
        ),
      },
      {
        key: 'isActive',
        header: 'الحالة',
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <StatusBadge active={row.isActive} />
            {canManage && <Switch checked={row.isActive} onChange={() => void handleToggle(row)} />}
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'إجراءات',
        render: (row) => (
          <div className="flex items-center gap-1">
            {canManage && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  title="تعديل"
                  onClick={() => {
                    setEditingRate(row);
                    setModalOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="حذف"
                  className="text-error hover:bg-error/10 hover:text-error"
                  onClick={() => setDeletingRate(row)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canManage],
  );

  return (
    <div>
      <PageHeader
        title={t('shippingRates.title')}
        subtitle={t('shippingRates.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            {canManage && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setEditingRate(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                إضافة شريحة
              </Button>
            )}
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </div>
        }
      />

      <Card padding="md" className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="الفرع"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="">كل الفروع</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
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
            data={rates}
            keyExtractor={(row) => row.id}
            emptyMessage="لا توجد شرائح أسعار توصيل"
          />
        )}
      </Card>

      <RateFormModal
        open={modalOpen}
        rate={editingRate}
        branches={branches}
        onClose={() => setModalOpen(false)}
        onSaved={applyMutation}
      />

      <ConfirmDialog
        open={deletingRate !== null}
        onClose={() => setDeletingRate(null)}
        onConfirm={() => void handleDelete()}
        title="حذف الشريحة"
        message={`هل أنت متأكد من حذف شريحة "${deletingRate?.branchName ?? ''}" (${deletingRate ? `${deletingRate.minDistanceKm} - ${deletingRate.maxDistanceKm} كم` : ''})؟ لا يمكن التراجع.`}
        loading={deleting}
      />
    </div>
  );
}