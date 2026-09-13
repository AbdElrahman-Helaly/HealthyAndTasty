import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, RefreshCw, LayoutGrid, Home } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/apiClient';
import {
  createAdminCategory,
  deleteAdminCategory,
  listAdminCategories,
  updateAdminCategory,
} from '@/api/categories.api';
import type { AdminCategory } from '@/types';
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

function formatApiError(err: unknown, fallback: string): { message: string; details: string[] } {
  if (err instanceof ApiError) {
    return { message: err.message || fallback, details: err.errors ?? [] };
  }
  return { message: err instanceof Error ? err.message : fallback, details: [] };
}

// ---------------------------------------------------------------------------
// Add modal
// ---------------------------------------------------------------------------

interface AddModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (category: AdminCategory) => void;
}

function AddCategoryModal({ open, onClose, onSaved }: AddModalProps) {
  const { show: showToast } = useToast();
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [homeDisplay, setHomeDisplay] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<{ message: string; details: string[] } | null>(null);

  useEffect(() => {
    if (!open) return;
    setId('');
    setName('');
    setHomeDisplay(false);
    setImageFile(null);
    setPreview('');
    setFieldErrors({});
    setApiError(null);
  }, [open]);

  const handleFile = (file: File | null) => {
    if (!file) {
      setImageFile(null);
      setPreview('');
      return;
    }
    if (!/^image\//.test(file.type)) {
      showToast('نوع الملف غير مدعوم — اختر صورة', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('حجم الصورة لا يتجاوز 10 MB', 'error');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const next: Record<string, string> = {};
    const numericId = Number(id);
    if (id.trim() === '' || !Number.isInteger(numericId) || numericId <= 0)
      next.id = 'المعرّف مطلوب ويجب أن يكون رقمًا صحيحًا موجبًا';
    if (!name.trim()) next.name = 'الاسم مطلوب';
    if (!imageFile) next.image = 'الصورة مطلوبة';
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setApiError(null);
    try {
      const saved = await createAdminCategory(numericId, name.trim(), homeDisplay, imageFile as File);
      onSaved(saved);
      showToast('تمت إضافة الفئة بنجاح', 'success');
      onClose();
    } catch (err) {
      const formatted = formatApiError(err, 'فشلت الإضافة');
      setApiError(formatted);
      showToast(formatted.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="إضافة فئة" size="md">
      <div className="flex flex-col gap-4">
        {apiError && (
          <div className="rounded-2xl border border-error/30 bg-error/5 px-4 py-3">
            <p className="text-sm font-semibold text-error">{apiError.message}</p>
            {apiError.details.length > 0 && (
              <ul className="mt-1.5 list-disc space-y-0.5 ps-5 text-xs text-error/90">
                {apiError.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <Input
          label="المعرّف (ID)"
          type="number"
          min={1}
          step={1}
          placeholder="مثال: 5"
          value={id}
          onChange={(e) => setId(e.target.value)}
          error={fieldErrors.id}
        />
        <Input
          label="الاسم"
          placeholder="اسم الفئة"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
        />
        <div>
          <label className="text-sm font-semibold text-gray-800 mb-1.5 block">صورة الفئة *</label>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container">
              {preview ? (
                <img src={preview} alt="معاينة" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-on-surface-variant/60">بدون صورة</span>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-on-surface-variant file:mr-4 file:rounded-xl file:border-0 file:bg-primary-surface file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary-surface/70"
              />
              <p className="mt-1 text-xs text-on-surface-variant/60">
                {imageFile ? imageFile.name : 'اختر صورة (حتى 10 MB)'}
              </p>
              {fieldErrors.image && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.image}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface-container px-4 py-3">
          <div>
            <p className="text-sm font-medium text-on-surface">العرض في الرئيسية</p>
            <p className="text-xs text-on-surface-variant/70">إظهار الفئة في الصفحة الرئيسية</p>
          </div>
          <Switch checked={homeDisplay} onChange={setHomeDisplay} />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button loading={saving} onClick={() => void handleSubmit()}>
            إضافة الفئة
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Edit modal
// ---------------------------------------------------------------------------

interface EditModalProps {
  open: boolean;
  category: AdminCategory | null;
  onClose: () => void;
  onSaved: (category: AdminCategory) => void;
}

function EditCategoryModal({ open, category, onClose, onSaved }: EditModalProps) {
  const { show: showToast } = useToast();
  const [name, setName] = useState('');
  const [homeDisplay, setHomeDisplay] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<{ message: string; details: string[] } | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? '');
    setHomeDisplay(category?.homeDisplay ?? false);
    setImageFile(null);
    setPreview(category?.image ?? '');
    setFieldErrors({});
    setApiError(null);
  }, [open, category]);

  const handleFile = (file: File | null) => {
    if (!file) {
      setImageFile(null);
      setPreview(category?.image ?? '');
      return;
    }
    if (!/^image\//.test(file.type)) {
      showToast('نوع الملف غير مدعوم — اختر صورة', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('حجم الصورة لا يتجاوز 10 MB', 'error');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!category) return;
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'الاسم مطلوب';
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setApiError(null);
    try {
      // multipart/form-data — omit image to keep the existing one
      const saved = await updateAdminCategory(
        category.id,
        name.trim(),
        homeDisplay,
        imageFile ?? undefined,
      );
      onSaved(saved);
      showToast('تم تحديث الفئة بنجاح', 'success');
      onClose();
    } catch (err) {
      const formatted = formatApiError(err, 'فشل التحديث');
      setApiError(formatted);
      showToast(formatted.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`تعديل الفئة #${category?.id ?? ''}`} size="md">
      <div className="flex flex-col gap-4">
        {apiError && (
          <div className="rounded-2xl border border-error/30 bg-error/5 px-4 py-3">
            <p className="text-sm font-semibold text-error">{apiError.message}</p>
            {apiError.details.length > 0 && (
              <ul className="mt-1.5 list-disc space-y-0.5 ps-5 text-xs text-error/90">
                {apiError.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <Input
          label="الاسم"
          placeholder="اسم الفئة"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
        />
        <div>
          <label className="text-sm font-semibold text-gray-800 mb-1.5 block">صورة الفئة</label>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container">
              {preview ? (
                <img src={preview} alt="معاينة" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-on-surface-variant/60">بدون صورة</span>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-on-surface-variant file:mr-4 file:rounded-xl file:border-0 file:bg-primary-surface file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary-surface/70"
              />
              <p className="mt-1 text-xs text-on-surface-variant/60">
                {imageFile
                  ? imageFile.name
                  : 'اختياري — اتركه فارغًا للاحتفاظ بالصورة الحالية'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface-container px-4 py-3">
          <div>
            <p className="text-sm font-medium text-on-surface">العرض في الرئيسية</p>
            <p className="text-xs text-on-surface-variant/70">إظهار الفئة في الصفحة الرئيسية</p>
          </div>
          <Switch checked={homeDisplay} onChange={setHomeDisplay} />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button loading={saving} onClick={() => void handleSubmit()}>
            حفظ التعديلات
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function CategoriesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { show: showToast } = useToast();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; details: string[] } | null>(null);
  const [homeOnly, setHomeOnly] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  usePageTitle(t('adminCategories.title'));

  const canManage = useMemo(() => {
    const role = (user?.role ?? '').toLowerCase().replace(/\s+/g, '');
    return MANAGER_ROLES.some((r) => role.includes(r));
  }, [user?.role]);

  const load = useCallback(async (homeDisplayOnly?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const list = await listAdminCategories(homeDisplayOnly);
      setCategories(list ?? []);
    } catch (err) {
      setError(formatApiError(err, 'فشل تحميل الفئات'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(homeOnly || undefined);
  }, [load, homeOnly]);

  const applySaved = useCallback(
    (saved: AdminCategory) => {
      // Refresh the list to reflect server state after create/update
      void load(homeOnly || undefined);
      setCategories((prev) => {
        const exists = prev.some((c) => c.id === saved.id);
        return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved];
      });
    },
    [load, homeOnly],
  );

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteAdminCategory(deleting.id);
      showToast('تم حذف الفئة بنجاح', 'success');
      setDeleting(null);
      // Refresh the list after delete
      await load(homeOnly || undefined);
    } catch (err) {
      const formatted = formatApiError(err, 'فشل الحذف — قد تكون الفئة مرتبطة بمنتجات');
      showToast(
        formatted.details.length > 0
          ? `${formatted.message}: ${formatted.details.join('، ')}`
          : formatted.message,
        'error',
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = useMemo<Column<AdminCategory>[]>(
    () => [
      {
        key: 'image',
        header: 'الصورة',
        render: (row) => (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-surface text-primary">
            {row.image ? (
              <img src={row.image} alt={row.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <LayoutGrid className="h-5 w-5" />
            )}
          </div>
        ),
      },
      {
        key: 'id',
        header: 'ID',
        render: (row) => <span className="font-mono font-semibold text-on-surface">#{row.id}</span>,
      },
      {
        key: 'name',
        header: 'الاسم',
        render: (row) => <span className="font-medium text-on-surface">{row.name || '—'}</span>,
      },
      {
        key: 'homeDisplay',
        header: 'العرض في الرئيسية',
        render: (row) =>
          row.homeDisplay ? (
            <Badge variant="success">
              <span className="inline-flex items-center gap-1">
                <Home className="h-3 w-3" />
                معروضة
              </span>
            </Badge>
          ) : (
            <Badge variant="inactive">مخفية</Badge>
          ),
      },
      {
        key: 'productsCount',
        header: 'المنتجات',
        render: (row) => (
          <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-surface-container px-2 py-1 text-sm font-semibold tabular-nums text-on-surface">
            {row.productsCount ?? 0}
          </span>
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
                  onClick={() => setEditing(row)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="حذف"
                  className="text-error hover:bg-error/10 hover:text-error"
                  onClick={() => setDeleting(row)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [canManage],
  );

  return (
    <div>
      <PageHeader
        title={t('adminCategories.title')}
        subtitle={t('adminCategories.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            {canManage && (
              <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                إضافة فئة
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => void load(homeOnly || undefined)}
            >
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-outline-variant/40 bg-surface px-4 py-2 text-sm text-on-surface">
          <input
            type="checkbox"
            className="h-4 w-4 accent-emerald-600"
            checked={homeOnly}
            onChange={(e) => setHomeOnly(e.target.checked)}
          />
          عرض فئات الرئيسية فقط
        </label>
        <span className="text-xs text-on-surface-variant/70">
          {categories.length} فئة
        </span>
      </div>

      <Card padding="none">
        {loading && (
          <div className="py-16 text-center text-sm text-on-surface-variant">
            جاري تحميل الفئات...
          </div>
        )}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm font-semibold text-error">{error.message}</p>
            {error.details.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 ps-5 text-xs text-error/90">
                {error.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => void load(homeOnly || undefined)}
            >
              إعادة المحاولة
            </Button>
          </div>
        )}
        {!loading && !error && (
          <DataTable
            columns={columns}
            data={categories}
            keyExtractor={(row) => String(row.id)}
            emptyMessage="لا توجد فئات"
          />
        )}
      </Card>

      <AddCategoryModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={applySaved} />

      <EditCategoryModal
        open={editing !== null}
        category={editing}
        onClose={() => setEditing(null)}
        onSaved={applySaved}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDelete()}
        title="حذف الفئة"
        message={
          <span>
            هل أنت متأكد من حذف فئة <strong>“{deleting?.name ?? ''}”</strong> (#{deleting?.id})؟
            لا يمكن التراجع.
            {(deleting?.productsCount ?? 0) > 0 && (
              <span className="mt-2 block font-semibold text-error">
                هذه الفئة تحتوي على {deleting?.productsCount} منتج — الحذف محظور وسيُرفض من الخادم.
              </span>
            )}
          </span>
        }
        loading={deleteLoading}
      />
    </div>
  );
}
