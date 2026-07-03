import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { SearchFilters, SelectFilter } from '@/components/shared/SearchFilters';
import { FormDrawer } from '@/components/shared/FormDrawer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { LoadingSkeleton } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/Modal';
import { ToastList } from '@/components/ui/ToastList';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/hooks/useToast';
import { useAsync } from '@/hooks/useAsync';
import { ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { getCategories } from '@/services/categoriesApi';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  importProductsExcel,
  getImportHistory,
} from '@/services/productsApi';
import type { Product, ImportHistoryRecord, ProductListParams } from '@/types';
import type { CreateProductBody, UpdateProductBody } from '@/services/productsApi';

// ---------------------------------------------------------------------------
// Debounce helper
// ---------------------------------------------------------------------------
function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

// ---------------------------------------------------------------------------
// Product Form Drawer
// ---------------------------------------------------------------------------
interface ProductFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editTarget: Product | null;
  categories: Array<{ id: string; nameAr: string; name: string }>;
  showToast: (msg: string, variant?: 'success' | 'error' | 'info') => void;
}

const DEFAULT_FORM: CreateProductBody = {
  branchId: '',
  sku: '',
  name: '',
  price: 0,
  currency: 'EGP',
  isActive: true,
  categoryId: '',
  supplier: '',
  productId: '',
  description: '',
  stockQuantity: 0,
};

function ProductFormDrawer({
  open,
  onClose,
  onSaved,
  editTarget,
  categories,
  showToast,
}: ProductFormDrawerProps) {
  const { t } = useTranslation();
  const isEdit = editTarget !== null;

  const [form, setForm] = useState<CreateProductBody>({ ...DEFAULT_FORM });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editTarget) {
      setForm({
        branchId: editTarget.branchId ?? '',
        sku: editTarget.sku,
        name: editTarget.name,
        price: editTarget.price,
        currency: editTarget.currency,
        isActive: editTarget.isActive,
        categoryId: editTarget.categoryId,
        supplier: editTarget.supplier ?? '',
        productId: editTarget.productId ?? '',
        description: editTarget.description ?? '',
        stockQuantity: editTarget.stockQuantity ?? 0,
      });
    } else {
      setForm({ ...DEFAULT_FORM });
    }
    setFieldErrors({});
  }, [editTarget, open]);

  function set<K extends keyof CreateProductBody>(key: K, val: CreateProductBody[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.branchId.trim()) errs.branchId = 'معرّف الفرع مطلوب';
    if (!isEdit && !form.sku.trim()) errs.sku = 'الرمز SKU مطلوب';
    if (!form.name.trim()) errs.name = 'الاسم مطلوب';
    if (form.price <= 0) errs.price = 'السعر يجب أن يكون أكبر من صفر';
    if (!form.categoryId) errs.categoryId = 'الفئة مطلوبة';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit && editTarget) {
        const body: UpdateProductBody = {
          branchId: form.branchId,
          name: form.name,
          price: form.price,
          currency: form.currency,
          isActive: form.isActive,
          categoryId: form.categoryId,
          supplier: form.supplier || undefined,
          productId: form.productId || undefined,
          description: form.description || undefined,
          stockQuantity: form.stockQuantity,
        };
        await updateProduct(editTarget.id, body);
        showToast(t('products.updateSuccess'), 'success');
      } else {
        await createProduct({
          ...form,
          supplier: form.supplier || undefined,
          productId: form.productId || undefined,
          description: form.description || undefined,
        });
        showToast(t('products.createSuccess'), 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      // Known backend bug: POST/PUT /products returns 500
      if (status >= 500) {
        showToast('حدث خطأ في الخادم، يرجى المحاولة لاحقاً', 'error');
      } else {
        showToast(err instanceof Error ? err.message : t('products.serverError'), 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={isEdit ? t('products.editProduct') : t('products.addProduct')}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button loading={saving} onClick={handleSave}>{t('common.save')}</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label={t('products.branchId')}
          value={form.branchId}
          onChange={(e) => set('branchId', e.target.value)}
          error={fieldErrors.branchId}
          dir="ltr"
        />
        {/* SKU — create only */}
        {!isEdit && (
          <Input
            label={t('products.sku')}
            value={form.sku}
            onChange={(e) => set('sku', e.target.value)}
            error={fieldErrors.sku}
            dir="ltr"
          />
        )}
        <Input
          label={t('common.create') === 'إنشاء' ? 'الاسم' : 'Name'}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={fieldErrors.name}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('products.price')}
            type="number"
            step="0.01"
            min={0}
            value={String(form.price)}
            onChange={(e) => set('price', parseFloat(e.target.value) || 0)}
            error={fieldErrors.price}
          />
          <Input
            label={t('products.currency')}
            value={form.currency}
            onChange={(e) => set('currency', e.target.value)}
            dir="ltr"
          />
        </div>
        {/* Category select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-on-surface">{t('products.category')}</label>
          <select
            value={form.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
            className={`h-11 rounded-lg border bg-surface px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              fieldErrors.categoryId ? 'border-error' : 'border-outline-variant'
            }`}
          >
            <option value="">{t('categories.noParent')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nameAr || c.name}</option>
            ))}
          </select>
          {fieldErrors.categoryId && (
            <p className="text-xs text-error">{fieldErrors.categoryId}</p>
          )}
        </div>
        <Input
          label={t('products.supplier')}
          value={form.supplier ?? ''}
          onChange={(e) => set('supplier', e.target.value)}
        />
        <Input
          label={t('products.productId')}
          value={form.productId ?? ''}
          onChange={(e) => set('productId', e.target.value)}
          dir="ltr"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-on-surface">{t('products.description')}</label>
          <textarea
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <Input
          label={t('products.stockQuantity')}
          type="number"
          min={0}
          value={String(form.stockQuantity ?? 0)}
          onChange={(e) => set('stockQuantity', parseInt(e.target.value, 10) || 0)}
        />
        <label className="flex items-center gap-2.5 text-sm font-medium text-on-surface cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
            className="h-4 w-4 rounded border-outline-variant accent-primary"
          />
          {t('products.isActive')}
        </label>
      </div>
    </FormDrawer>
  );
}

// ---------------------------------------------------------------------------
// Import drawer
// ---------------------------------------------------------------------------
interface ImportDrawerProps {
  open: boolean;
  onClose: () => void;
  showToast: (msg: string, variant?: 'success' | 'error' | 'info') => void;
}

function ImportDrawer({ open, onClose, showToast }: ImportDrawerProps) {
  const { t } = useTranslation();
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: historyPage, isLoading: loadingHistory, refetch: refetchHistory } = useAsync(
    () => getImportHistory({ pageSize: 20 }),
    [],
  );
  const history = historyPage?.items ?? [];

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx')) {
      showToast('يرجى اختيار ملف Excel بامتداد .xlsx', 'error');
      return;
    }
    setImporting(true);
    try {
      await importProductsExcel(file);
      showToast(t('products.importSuccess'), 'success');
      refetchHistory();
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      if (status >= 500) {
        showToast('حدث خطأ في الخادم، يرجى المحاولة لاحقاً', 'error');
      } else {
        showToast(err instanceof Error ? err.message : t('products.serverError'), 'error');
      }
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const importColumns = [
    { key: 'user', header: t('products.importUser'), render: (r: ImportHistoryRecord) => r.userName || r.userId },
    { key: 'branch', header: t('products.importBranch'), render: (r: ImportHistoryRecord) => r.branchName || r.branchId },
    { key: 'file', header: t('products.importFile'), render: (r: ImportHistoryRecord) => (
      <span className="max-w-[180px] truncate block text-xs font-mono">{r.fileName}</span>
    )},
    { key: 'created', header: t('products.importCreated'), render: (r: ImportHistoryRecord) => (
      <span className="text-success font-semibold">{r.createdCount}</span>
    )},
    { key: 'updated', header: t('products.importUpdated'), render: (r: ImportHistoryRecord) => (
      <span className="text-primary font-semibold">{r.updatedCount}</span>
    )},
    { key: 'failed', header: t('products.importFailed'), render: (r: ImportHistoryRecord) => (
      <span className="text-error font-semibold">{r.failedCount}</span>
    )},
    { key: 'date', header: t('products.importDate'), render: (r: ImportHistoryRecord) => (
      <span className="text-xs text-on-surface-variant">
        {formatDate(r.uploadedAtUtc, 'ar-EG')}
      </span>
    )},
  ];

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={t('products.importSection')}
      footer={
        <div className="flex gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="secondary"
            loading={importing}
            onClick={() => fileRef.current?.click()}
            className="gap-2"
          >
            <UploadCloud className="h-4 w-4" />
            {t('products.importExcel')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="mb-3 text-sm font-semibold text-on-surface">{t('products.importHistory')}</p>
          {loadingHistory ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={importColumns}
              data={history}
              keyExtractor={(r) => r.id}
              emptyMessage="لا يوجد سجل استيراد بعد"
            />
          )}
        </div>
      </div>
    </FormDrawer>
  );
}

// ---------------------------------------------------------------------------
// Main ProductsPage
// ---------------------------------------------------------------------------
export function ProductsPage() {
  const { t } = useTranslation();
  usePageTitle(t('products.title'));

  const { toasts, show: showToast, dismiss } = useToast();

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplier, setSupplier] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const dSearch = useDebounced(search, 400);
  const dSupplier = useDebounced(supplier, 400);

  // Build params from filters
  const params = useMemo<ProductListParams>(() => {
    const p: ProductListParams = { page, pageSize: PAGE_SIZE };
    if (dSearch) p.search = dSearch;
    if (categoryId) p.categoryId = categoryId;
    if (statusFilter === 'active') p.isActive = true;
    if (statusFilter === 'inactive') p.isActive = false;
    if (dSupplier) p.supplier = dSupplier;
    if (minPrice !== '') p.minPrice = parseFloat(minPrice);
    if (maxPrice !== '') p.maxPrice = parseFloat(maxPrice);
    return p;
  }, [page, dSearch, categoryId, statusFilter, dSupplier, minPrice, maxPrice]);

  const { data: productPage, isLoading, error, refetch } = useAsync(
    () => getProducts(params),
    [JSON.stringify(params)],
  );

  const products = productPage?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((productPage?.total ?? 0) / PAGE_SIZE));

  // Reset to page 1 when filters change
  const prevParams = useRef(params);
  useEffect(() => {
    const prev = prevParams.current;
    if (
      prev.search !== params.search ||
      prev.categoryId !== params.categoryId ||
      prev.isActive !== params.isActive ||
      prev.supplier !== params.supplier ||
      prev.minPrice !== params.minPrice ||
      prev.maxPrice !== params.maxPrice
    ) {
      setPage(1);
    }
    prevParams.current = params;
  }, [params]);

  // Categories for dropdowns
  const { data: categories } = useAsync(() => getCategories({ pageSize: 50 }), []);
  const categoryOptions = useMemo(() => {
    const opts = [{ value: '', label: t('common.all') }];
    (categories ?? []).forEach((c) => opts.push({ value: c.id, label: c.nameAr || c.name }));
    return opts;
  }, [categories, t]);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const openCreate = useCallback(() => {
    setEditTarget(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((p: Product) => {
    setEditTarget(p);
    setFormOpen(true);
  }, []);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      showToast(t('products.deleteSuccess'), 'success');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      if (status >= 500) {
        showToast('حدث خطأ في الخادم، يرجى المحاولة لاحقاً', 'error');
      } else {
        showToast(err instanceof Error ? err.message : t('products.serverError'), 'error');
      }
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, refetch, showToast, t]);

  function clearFilters() {
    setSearch('');
    setCategoryId('');
    setStatusFilter('');
    setSupplier('');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
  }

  const hasFilters = !!(dSearch || categoryId || statusFilter || dSupplier || minPrice || maxPrice);

  const columns = [
    {
      key: 'sku',
      header: t('products.sku'),
      render: (row: Product) => (
        <span className="font-mono text-xs text-primary">{row.sku}</span>
      ),
    },
    {
      key: 'name',
      header: 'الاسم',
      render: (row: Product) => (
        <span className="font-medium">{row.name}</span>
      ),
    },
    {
      key: 'category',
      header: t('products.category'),
      render: (row: Product) => (
        <span className="text-sm text-on-surface-variant">{row.categoryName || '—'}</span>
      ),
    },
    {
      key: 'price',
      header: `${t('products.price')} (${t('products.currency') === 'العملة' ? 'EGP' : 'EGP'})`,
      render: (row: Product) => (
        <span className="tabular-nums">{row.price.toFixed(2)} {row.currency}</span>
      ),
    },
    {
      key: 'stock',
      header: t('products.stock'),
      render: (row: Product) => (
        <span className="tabular-nums">{row.stockQuantity ?? '—'}</span>
      ),
    },
    {
      key: 'supplier',
      header: t('products.supplier'),
      render: (row: Product) => (
        <span className="text-sm text-on-surface-variant">{row.supplier || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row: Product) => <StatusBadge active={row.isActive} />,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (row: Product) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            title={t('common.edit')}
            onClick={() => openEdit(row)}
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
        title={t('products.title')}
        subtitle={t('products.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setImportOpen(true)}
              className="gap-1.5"
            >
              <UploadCloud className="h-4 w-4" />
              {t('products.importExcel')}
            </Button>
            <Button onClick={openCreate} className="gap-1.5">
              <Plus className="h-4 w-4" />
              {t('products.addProduct')}
            </Button>
          </div>
        }
      />

      <Card>
        {/* Filter bar */}
        <SearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('common.search')}
        >
          <SelectFilter
            label={t('products.category')}
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions}
          />
          <SelectFilter
            label={t('common.status')}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: t('common.all') },
              { value: 'active', label: t('common.active') },
              { value: 'inactive', label: t('common.inactive') },
            ]}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">{t('products.supplier')}</label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder={t('products.supplier')}
              className="h-10 rounded-lg border border-outline-variant bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">{t('products.minPrice')} / {t('products.maxPrice')}</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="h-10 w-20 rounded-lg border border-outline-variant bg-surface px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-on-surface-variant text-xs">—</span>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="∞"
                className="h-10 w-20 rounded-lg border border-outline-variant bg-surface px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          {hasFilters && (
            <div className="flex flex-col gap-1">
              <label className="text-xs opacity-0">x</label>
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                {t('products.clearFilters')}
              </Button>
            </div>
          )}
        </SearchFilters>

        {/* Error */}
        {error && !isLoading && (
          <div className="rounded-xl bg-error/10 border border-error/20 px-4 py-3 text-sm text-error mb-4">
            {error.message}
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <>
            {products.length === 0 ? (
              <EmptyState
                icon={<Package className="h-6 w-6" />}
                title={t('products.noProducts')}
              />
            ) : (
              <DataTable
                columns={columns}
                data={products}
                keyExtractor={(row) => row.id}
                emptyMessage={t('products.noProducts')}
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-outline-variant/40 pt-4">
                <span className="text-sm text-on-surface-variant">
                  صفحة {page} من {totalPages}
                  {productPage?.total !== undefined && (
                    <span className="ms-1 text-xs">({productPage.total} نتيجة)</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Import drawer */}
      <ImportDrawer
        open={importOpen}
        onClose={() => setImportOpen(false)}
        showToast={showToast}
      />

      {/* Product form */}
      <ProductFormDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refetch}
        editTarget={editTarget}
        categories={categories ?? []}
        showToast={showToast}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={t('common.delete')}
        message={t('products.deleteConfirm')}
      />

      <ToastList toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
