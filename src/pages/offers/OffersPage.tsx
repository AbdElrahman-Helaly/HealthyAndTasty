import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, RefreshCw, Tag } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { StatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { listBranches } from '@/api/branches.api';
import { listCatalogProducts } from '@/api/catalog.api';
import {
  createOffer,
  deleteOffer,
  listOffers,
  toggleOffer,
  updateOffer,
} from '@/api/offers.api';
import { formatDate } from '@/lib/utils';
import type { BranchAdmin, CatalogProduct, Offer } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const ADMIN_ROLES = ['admin'];

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

function toLocalInputValue(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface OfferFormModalProps {
  open: boolean;
  offer: Offer | null;
  branches: BranchAdmin[];
  products: CatalogProduct[];
  onClose: () => void;
  onSaved: (offer: Offer) => void;
}

function OfferFormModal({ open, offer, branches, products, onClose, onSaved }: OfferFormModalProps) {
  const { show: showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [imageName, setImageName] = useState('');
  const [discount, setDiscount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branchId, setBranchId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');
  const [productIds, setProductIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setTitle(offer?.title ?? '');
    setDescription(offer?.description ?? '');
    setImage(offer?.image ?? '');
    setImageName(offer?.imageName ?? '');
    setDiscount(offer ? String(offer.discount) : '');
    setStartDate(offer ? toLocalInputValue(offer.startDate) : '');
    setEndDate(offer ? toLocalInputValue(offer.endDate) : '');
    setBranchId(offer?.branchId ? String(offer.branchId) : '');
    setIsActive(offer?.isActive ?? true);
    setSortOrder(offer ? String(offer.sortOrder) : '0');
    setProductIds(offer?.productIds?.length ? offer.productIds.map(String) : []);
    setErrors({});
  }, [open, offer]);

  const parseProductIds = (raw: string[]): number[] => {
    return raw.map(Number).filter((n) => !Number.isNaN(n));
  };

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = 'العنوان مطلوب';
    const disc = Number(discount);
    if (discount === '' || Number.isNaN(disc) || disc < 0 || disc > 100)
      nextErrors.discount = 'الخصم يجب أن يكون بين 0 و 100';
    if (!startDate) nextErrors.startDate = 'تاريخ البداية مطلوب';
    if (!endDate) nextErrors.endDate = 'تاريخ النهاية مطلوب';
    if (startDate && endDate && new Date(endDate) < new Date(startDate))
      nextErrors.endDate = 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
    const sort = Number(sortOrder);
    if (sortOrder === '' || Number.isNaN(sort)) nextErrors.sortOrder = 'ترتيب العرض مطلوب';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        description,
        image,
        imageName,
        discount: disc,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        branchId: branchId ? Number(branchId) : 0,
        isActive,
        sortOrder: sort,
        productIds: parseProductIds(productIds),
      };
      const saved = offer
        ? await updateOffer(offer.id, body)
        : await createOffer(body);
      onSaved(saved);
      showToast(offer ? 'تم التحديث بنجاح' : 'تمت الإضافة بنجاح', 'success');
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
      title={offer ? 'تعديل العرض' : 'إضافة عرض'}
      size="lg"
    >
      <div className="flex flex-col gap-4">
        <Input
          label="العنوان"
          placeholder="اسم العرض"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />
        <Textarea
          label="الوصف"
          placeholder="وصف العرض"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="رابط الصورة"
            placeholder="https://..."
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
          <Input
            label="اسم الصورة"
            placeholder="offer.jpg"
            value={imageName}
            onChange={(e) => setImageName(e.target.value)}
          />
          <Input
            label="نسبة الخصم (%)"
            type="number"
            min={0}
            max={100}
            step="any"
            placeholder="10"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            error={errors.discount}
          />
          <Input
            label="ترتيب العرض"
            type="number"
            min={0}
            step="1"
            placeholder="0"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            error={errors.sortOrder}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="تاريخ البدء"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={errors.startDate}
          />
          <Input
            label="تاريخ الانتهاء"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            error={errors.endDate}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="الفرع"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">كل الفروع</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          <MultiSelect
            label="المنتجات"
            placeholder="اختر المنتجات..."
            options={products.map((p) => ({ label: p.productName, value: String(p.id) }))}
            value={productIds}
            onChange={setProductIds}
          />
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface-container px-4 py-3">
          <div>
            <p className="text-sm font-medium text-on-surface">نشط</p>
            <p className="text-xs text-on-surface-variant/70">إظهار العرض في التطبيق</p>
          </div>
          <Switch checked={isActive} onChange={setIsActive} />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button loading={saving} onClick={() => void handleSubmit()}>
            {offer ? 'حفظ التعديلات' : 'إضافة العرض'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function OffersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { show: showToast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [branches, setBranches] = useState<BranchAdmin[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deletingOffer, setDeletingOffer] = useState<Offer | null>(null);
  const [deleting, setDeleting] = useState(false);
  usePageTitle(t('offers.title'));

  const canManage = useMemo(() => {
    const role = (user?.role ?? '').toLowerCase();
    return ADMIN_ROLES.includes(role);
  }, [user?.role]);

  const resolveBranchName = useCallback(
    (branchId: number | null | undefined) =>
      branches.find((b) => Number(b.id) === Number(branchId))?.name ?? '',
    [branches],
  );

  const load = useCallback(async () => {
    setError('');
    try {
      const [offerList, branchList, productList] = await Promise.all([
        listOffers(),
        listBranches(),
        listCatalogProducts(),
      ]);
      setOffers(offerList);
      setBranches(branchList);
      setProducts(productList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل العروض');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const applyMutation = useCallback((offer: Offer) => {
    setOffers((prev) => {
      const exists = prev.some((o) => o.id === offer.id);
      return exists ? prev.map((o) => (o.id === offer.id ? offer : o)) : [...prev, offer];
    });
  }, []);

  const handleToggle = async (offer: Offer) => {
    try {
      const updated = await toggleOffer(offer.id);
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, isActive: updated.isActive } : o)));
      showToast('تم التحديث بنجاح', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشل التحديث', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingOffer) return;
    setDeleting(true);
    try {
      await deleteOffer(deletingOffer.id);
      setOffers((prev) => prev.filter((o) => o.id !== deletingOffer.id));
      showToast('تم الحذف بنجاح', 'success');
      setDeletingOffer(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشل الحذف', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<Column<Offer>[]>(
    () => [
      {
        key: 'title',
        header: 'العرض',
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-surface text-primary">
              {row.image ? (
                <img src={row.image} alt={row.title} className="h-full w-full object-cover" />
              ) : (
                <Tag className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-on-surface truncate">{row.title || '—'}</p>
              {row.description && (
                <p className="text-xs text-on-surface-variant/70 truncate max-w-[260px]">{row.description}</p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'discount',
        header: 'الخصم',
        render: (row) => (
          <span className="inline-flex items-center rounded-lg bg-success/10 px-2 py-1 text-sm font-semibold text-success">
            {Number(row.discount)}%
          </span>
        ),
      },
      {
        key: 'branchId',
        header: 'الفرع',
        render: (row) => (
          <span className="text-sm text-on-surface-variant/90">
            {resolveBranchName(row.branchId) || 'كل الفروع'}
          </span>
        ),
      },
      {
        key: 'dates',
        header: 'الفترة',
        render: (row) => (
          <div className="text-xs text-on-surface-variant/90">
            <p>{formatDate(row.startDate, 'ar-EG')}</p>
            <p className="text-on-surface-variant/60">إلى {formatDate(row.endDate, 'ar-EG')}</p>
          </div>
        ),
      },
      {
        key: 'products',
        header: 'المنتجات',
        render: (row) => (
          <span className="text-sm text-on-surface-variant/90">
            {row.productIds?.length ?? 0}
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
                    setEditingOffer(row);
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
                  onClick={() => setDeletingOffer(row)}
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
    [canManage, resolveBranchName],
  );

  return (
    <div>
      <PageHeader
        title={t('offers.title')}
        subtitle={t('offers.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            {canManage && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setEditingOffer(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                إضافة عرض
              </Button>
            )}
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </div>
        }
      />

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
            data={offers}
            keyExtractor={(row) => String(row.id)}
            emptyMessage="لا توجد عروض"
          />
        )}
      </Card>

      <OfferFormModal
        open={modalOpen}
        offer={editingOffer}
        branches={branches}
        products={products}
        onClose={() => setModalOpen(false)}
        onSaved={applyMutation}
      />

      <ConfirmDialog
        open={deletingOffer !== null}
        onClose={() => setDeletingOffer(null)}
        onConfirm={() => void handleDelete()}
        title="حذف العرض"
        message={`هل أنت متأكد من حذف عرض "${deletingOffer?.title ?? ''}"؟ لا يمكن التراجع.`}
        loading={deleting}
      />
    </div>
  );
}
