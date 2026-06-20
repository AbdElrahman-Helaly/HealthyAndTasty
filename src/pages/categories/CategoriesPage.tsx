import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, FolderTree, Search, Package } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormDrawer } from '@/components/shared/FormDrawer';
import { DataTable } from '@/components/shared/DataTable';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { LoadingSkeleton } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ToastList } from '@/components/ui/ToastList';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/hooks/useToast';
import { useAsync } from '@/hooks/useAsync';
import { ApiError } from '@/lib/api';
import {
  getCategories,
  getSubcategories,
  createCategory,
  updateCategory,
} from '@/services/categoriesApi';
import { getProducts } from '@/services/productsApi';
import type { Category, PaginatedResponse, Product } from '@/types';
import type { CreateCategoryBody, UpdateCategoryBody } from '@/services/categoriesApi';

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

function emptyProductPage(): PaginatedResponse<Product> {
  return { items: [], total: 0, page: 1, pageSize: 50 };
}

// ---------------------------------------------------------------------------
// Category card
// ---------------------------------------------------------------------------
interface CategoryCardProps {
  category: Category;
  selected?: boolean;
  parentName?: string;
  onClick?: () => void;
  onEdit: (cat: Category) => void;
}

function CategoryCard({ category, selected, parentName, onClick, onEdit }: CategoryCardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      onClick={onClick}
      className={`group flex items-start justify-between gap-3 rounded-xl border p-3 transition-colors cursor-pointer ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-outline-variant/40 bg-surface hover:bg-surface-container/50'
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-on-surface">{category.name}</p>
        <p className="truncate text-xs text-on-surface-variant">{category.nameAr}</p>
        {parentName && (
          <p className="mt-0.5 truncate text-xs text-on-surface-variant/60">{parentName}</p>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          <StatusBadge active={category.isActive} />
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(category); }}
        className="mt-0.5 shrink-0 rounded-lg p-1.5 text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-container"
        aria-label="تعديل"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category form drawer (create / edit)
// ---------------------------------------------------------------------------
interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editTarget: Category | null;
  /** If set, this is a subcategory form and parentId is pre-filled */
  defaultParentId?: string;
  showToast: (msg: string, variant?: 'success' | 'error' | 'info') => void;
}

function CategoryFormDrawer({
  open,
  onClose,
  onSaved,
  editTarget,
  defaultParentId,
  showToast,
}: CategoryFormProps) {
  const { t } = useTranslation();
  const isEdit = editTarget !== null;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Populate fields when editing
  useEffect(() => {
    if (editTarget) {
      setName(editTarget.name);
      setNameAr(editTarget.nameAr);
      setSortOrder((editTarget as Category & { sortOrder?: number }).sortOrder ?? 0);
      setIsActive(editTarget.isActive);
      setCode('');
    } else {
      setName('');
      setNameAr('');
      setSortOrder(0);
      setIsActive(true);
      setCode('');
    }
    setFieldErrors({});
  }, [editTarget, open]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!isEdit && !code.trim()) errs.code = 'الكود مطلوب';
    if (!name.trim()) errs.name = 'الاسم بالإنجليزية مطلوب';
    if (!nameAr.trim()) errs.nameAr = 'الاسم بالعربية مطلوب';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit && editTarget) {
        const body: UpdateCategoryBody = {
          name: name.trim(),
          nameAr: nameAr.trim(),
          sortOrder,
          isActive,
          parentId: editTarget.parentId ?? undefined,
        };
        await updateCategory(editTarget.id, body);
        showToast(t('categories.updateSuccess'), 'success');
      } else {
        const body: CreateCategoryBody = {
          code: code.trim(),
          name: name.trim(),
          nameAr: nameAr.trim(),
          sortOrder,
          parentId: defaultParentId,
        };
        await createCategory(body);
        showToast(t('categories.createSuccess'), 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      if (status >= 500) {
        showToast(t('categories.serverError'), 'error');
      } else {
        showToast(err instanceof Error ? err.message : t('categories.serverError'), 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={isEdit ? t('categories.edit') : defaultParentId ? t('categories.createSub') : t('categories.createMain')}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button loading={saving} onClick={handleSave}>{t('common.save')}</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Code — create only */}
        {!isEdit && (
          <Input
            label={t('categories.code')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={fieldErrors.code}
            placeholder="e.g. CAT-001"
          />
        )}
        <Input
          label={t('categories.nameEn')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          dir="ltr"
        />
        <Input
          label={t('categories.nameAr')}
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          error={fieldErrors.nameAr}
          dir="rtl"
        />
        <Input
          label={t('categories.sortOrder')}
          type="number"
          value={String(sortOrder)}
          onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
        />
        {/* isActive — edit only */}
        {isEdit && (
          <label className="flex items-center gap-2.5 text-sm font-medium text-on-surface cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-outline-variant accent-primary"
            />
            {t('common.active')}
          </label>
        )}
      </div>
    </FormDrawer>
  );
}

// ---------------------------------------------------------------------------
// Panel: list of categories with search + toolbar
// ---------------------------------------------------------------------------
interface PanelProps {
  title: string;
  subtitle?: string;
  categories: Category[];
  isLoading: boolean;
  selectedId?: string;
  onSelect?: (cat: Category) => void;
  onAdd: () => void;
  addLabel: string;
  emptyTitle: string;
  emptyDescription?: string;
  onEdit: (cat: Category) => void;
  parentMap?: Record<string, string>;
}

function CategoryPanel({
  title,
  subtitle,
  categories,
  isLoading,
  selectedId,
  onSelect,
  onAdd,
  addLabel,
  emptyTitle,
  emptyDescription,
  onEdit,
  parentMap,
}: PanelProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const dSearch = useDebounced(search, 400);

  const filtered = useMemo(() => {
    if (!dSearch.trim()) return categories;
    const q = dSearch.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameAr.includes(q),
    );
  }, [categories, dSearch]);

  return (
    <Card padding="none" className="flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant/40 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">{title}</p>
          {subtitle && <p className="text-xs text-on-surface-variant truncate">{subtitle}</p>}
        </div>
        <Button size="sm" onClick={onAdd} className="shrink-0 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </Button>
      </div>

      {/* Search */}
      <div className="relative px-3 pt-3 pb-2">
        <Search className="absolute start-6 top-1/2 mt-1.5 h-3.5 w-3.5 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common.search')}
          className="h-8 w-full rounded-lg border border-outline-variant bg-surface ps-8 pe-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-[72px] w-full" />
          ))}

        {!isLoading && filtered.length === 0 && (
          <EmptyState
            icon={<FolderTree className="h-6 w-6" />}
            title={emptyTitle}
            description={emptyDescription}
          />
        )}

        {!isLoading &&
          filtered.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              selected={cat.id === selectedId}
              parentName={parentMap ? parentMap[cat.parentId ?? ''] : undefined}
              onClick={onSelect ? () => onSelect(cat) : undefined}
              onEdit={onEdit}
            />
          ))}
      </div>
    </Card>
  );
}

interface SubcategoryProductsPanelProps {
  subcategory: Category | null;
  products: Product[];
  total: number;
  isLoading: boolean;
  error: Error | null;
}

function SubcategoryProductsPanel({
  subcategory,
  products,
  total,
  isLoading,
  error,
}: SubcategoryProductsPanelProps) {
  const { t } = useTranslation();

  const columns = [
    {
      key: 'sku',
      header: t('products.sku'),
      render: (row: Product) => <span className="font-mono text-xs text-primary">{row.sku || '-'}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      render: (row: Product) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'price',
      header: t('products.price'),
      render: (row: Product) => (
        <span className="tabular-nums">
          {row.price.toFixed(2)} {row.currency}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row: Product) => <StatusBadge active={row.isActive} />,
    },
  ];

  return (
    <Card padding="none" className="flex flex-col overflow-hidden md:col-span-2 lg:col-span-1">
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant/40 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-on-surface">
            {subcategory ? subcategory.name : 'Products'}
          </p>
          <p className="truncate text-xs text-on-surface-variant">
            {subcategory ? `${total} products` : 'Select a subcategory'}
          </p>
        </div>
        <Package className="h-4 w-4 shrink-0 text-primary" />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {!subcategory && (
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="Select a subcategory"
            description="Products will appear here."
          />
        )}

        {subcategory && error && !isLoading && (
          <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
            {error.message}
          </div>
        )}

        {subcategory && isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        )}

        {subcategory && !isLoading && !error && (
          <DataTable
            columns={columns}
            data={products}
            keyExtractor={(row) => row.id}
            emptyMessage={t('products.noProducts')}
          />
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main CategoriesPage
// ---------------------------------------------------------------------------
export function CategoriesPage() {
  const { t } = useTranslation();
  usePageTitle(t('categories.title'));

  const { toasts, show: showToast, dismiss } = useToast();

  // Main categories
  const {
    data: allCategories,
    isLoading: loadingMain,
    refetch: refetchMain,
  } = useAsync(() => getCategories({ pageSize: 50 }), []);

  const mainCategories = useMemo(
    () => (allCategories ?? []).filter((c) => !c.parentId),
    [allCategories],
  );

  // Selected parent for subcategory panel
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Category | null>(null);

  // Subcategories
  const {
    data: subData,
    isLoading: loadingSub,
    refetch: refetchSub,
  } = useAsync(
    () =>
      selectedParent
        ? getSubcategories(selectedParent.id)
        : Promise.resolve([] as Category[]),
    [selectedParent?.id],
  );
  const subcategories = subData ?? [];

  useEffect(() => {
    setSelectedSubcategory(null);
  }, [selectedParent?.id]);

  const {
    data: productPage,
    isLoading: loadingProducts,
    error: productsError,
  } = useAsync(
    () =>
      selectedSubcategory
        ? getProducts({ page: 1, pageSize: 50, categoryId: selectedSubcategory.id })
        : Promise.resolve(emptyProductPage()),
    [selectedSubcategory?.id],
  );
  const subcategoryProducts = productPage?.items ?? [];

  // Form drawer state
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | undefined>();

  const openCreateMain = useCallback(() => {
    setEditTarget(null);
    setDefaultParentId(undefined);
    setFormOpen(true);
  }, []);

  const openCreateSub = useCallback(() => {
    setEditTarget(null);
    setDefaultParentId(selectedParent?.id);
    setFormOpen(true);
  }, [selectedParent]);

  const openEdit = useCallback((cat: Category) => {
    setEditTarget(cat);
    setDefaultParentId(undefined);
    setFormOpen(true);
  }, []);

  const handleSaved = useCallback(() => {
    refetchMain();
    refetchSub();
  }, [refetchMain, refetchSub]);

  // Build parent name map for subcategory cards
  const parentNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    (allCategories ?? []).forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [allCategories]);

  return (
    <div>
      <PageHeader
        title={t('categories.title')}
        subtitle={t('categories.subtitle')}
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Right panel (RTL: start side) — Main categories */}
        <CategoryPanel
          title={t('categories.mainCategories')}
          categories={mainCategories}
          isLoading={loadingMain}
          selectedId={selectedParent?.id}
          onSelect={(cat) => setSelectedParent(cat)}
          onAdd={openCreateMain}
          addLabel={t('categories.createMain')}
          emptyTitle={t('common.noResults')}
          onEdit={openEdit}
        />

        {/* Left panel — Subcategories */}
        <CategoryPanel
          title={t('categories.subcategories')}
          subtitle={selectedParent ? selectedParent.name : undefined}
          categories={subcategories}
          isLoading={loadingSub && !!selectedParent}
          selectedId={selectedSubcategory?.id}
          onSelect={setSelectedSubcategory}
          onAdd={openCreateSub}
          addLabel={t('categories.createSub')}
          emptyTitle={
            selectedParent
              ? t('categories.noSubcategories')
              : t('categories.selectParent')
          }
          onEdit={openEdit}
          parentMap={parentNameMap}
        />

        <SubcategoryProductsPanel
          subcategory={selectedSubcategory}
          products={subcategoryProducts}
          total={productPage?.total ?? 0}
          isLoading={loadingProducts && !!selectedSubcategory}
          error={productsError}
        />
      </div>

      <CategoryFormDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        editTarget={editTarget}
        defaultParentId={defaultParentId}
        showToast={showToast}
      />

      <ToastList toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
