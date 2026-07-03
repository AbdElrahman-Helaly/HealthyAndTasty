import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, ImageIcon, UploadCloud, ToggleLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormDrawer } from '@/components/shared/FormDrawer';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSkeleton } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/Modal';
import { ToastList } from '@/components/ui/ToastList';
import { Badge } from '@/components/ui/Badge';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/hooks/useToast';
import { useAsync } from '@/hooks/useAsync';
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBanner,
  getActionTypes,
  getFullImageUrl,
} from '@/services/bannersApi';
import { getCategories } from '@/services/categoriesApi';
import { getProducts } from '@/services/productsApi';
import type { ActionTypeOption, Banner } from '@/types';
import type { CreateBannerData, UpdateBannerData } from '@/services/bannersApi';

// ---------------------------------------------------------------------------
// Inline toggle switch
// ---------------------------------------------------------------------------
function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-on-surface/20'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'}`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// BannerCard
// ---------------------------------------------------------------------------
interface BannerCardProps {
  banner: Banner;
  categoryName: string;
  actionTypeName: string;
  onEdit: (b: Banner) => void;
  onDelete: (b: Banner) => void;
  onToggle: (b: Banner) => void;
  toggling: boolean;
}

function BannerCard({ banner, categoryName, actionTypeName, onEdit, onDelete, onToggle, toggling }: BannerCardProps) {
  const [imgError, setImgError] = useState(false);
  const fullUrl = getFullImageUrl(banner.imageUrl);

  return (
    <Card padding="none" className="overflow-hidden flex flex-col">
      {/* 16:9 Image */}
      <div className="relative aspect-video bg-surface-container/30 flex items-center justify-center overflow-hidden">
        {fullUrl && !imgError ? (
          <img
            src={fullUrl}
            alt={categoryName}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <ImageIcon className="h-12 w-12 text-on-surface-variant/30" />
        )}
        {/* Status badge overlay */}
        <span className={`absolute top-2 start-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${banner.isActive ? 'bg-success/20 text-success' : 'bg-on-surface/20 text-on-surface-variant'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${banner.isActive ? 'bg-success' : 'bg-on-surface-variant'}`} />
          {banner.isActive ? 'Active' : 'Inactive'}
        </span>
        {/* Sort order badge */}
        <span className="absolute top-2 end-2 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
          #{banner.sortOrder}
        </span>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="truncate text-sm font-semibold text-on-surface">{categoryName || '—'}</p>
            {actionTypeName && (
              <Badge variant="neutral" className="w-fit text-xs">{actionTypeName}</Badge>
            )}
          </div>
          <ToggleSwitch checked={banner.isActive} onChange={() => onToggle(banner)} disabled={toggling} />
        </div>
        <div className="flex gap-2 mt-auto">
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(banner)}>
            <Pencil className="h-3.5 w-3.5 me-1" /> Edit
          </Button>
          <Button variant="danger" size="sm" className="flex-1" onClick={() => onDelete(banner)}>
            <Trash2 className="h-3.5 w-3.5 me-1" /> Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// BannerFormDrawer
// ---------------------------------------------------------------------------
interface BannerFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editTarget: Banner | null;
  categories: Array<{ id: string; name: string }>;
  actionTypes: ActionTypeOption[];
  products: Array<{ id: string; name: string }>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

function BannerFormDrawer({ open, onClose, onSaved, editTarget, categories, actionTypes, products, showToast }: BannerFormDrawerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [categoryId, setCategoryId] = useState('');
  const [productId, setProductId] = useState('');
  const [actionType, setActionType] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  // Reset form when drawer opens/closes
  const handleOpen = useCallback(() => {
    if (editTarget) {
      setCategoryId(editTarget.categoryId);
      setProductId(editTarget.productId);
      setActionType(editTarget.actionType);
      setIsActive(editTarget.isActive);
      setSortOrder(editTarget.sortOrder);
      setPreviewUrl(getFullImageUrl(editTarget.imageUrl));
    } else {
      setCategoryId('');
      setProductId('');
      setActionType(0);
      setIsActive(true);
      setSortOrder(0);
      setPreviewUrl('');
    }
    setFile(null);
  }, [editTarget]);

  // Run reset when open changes to true
  useMemo(() => { if (open) handleOpen(); }, [open, handleOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget && !file) return;
    if (actionType === 2 && !categoryId) return;
    if (actionType === 3 && !productId) return;

    setSaving(true);
    try {
      if (editTarget) {
        const data: UpdateBannerData = { categoryId, productId, actionType, isActive, sortOrder };
        if (file) data.file = file;
        await updateBanner(editTarget.id, data);
        showToast('Banner updated successfully', 'success');
      } else {
        const data: CreateBannerData = { file: file!, categoryId, productId, actionType, isActive, sortOrder };
        await createBanner(data);
        showToast('Banner created successfully', 'success');
      }
      onSaved();
      onClose();
    } catch {
      showToast('An error occurred, please try again', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={editTarget ? 'Edit Banner' : 'Add Banner'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit as unknown as React.MouseEventHandler} loading={saving}>
            {editTarget ? 'Update' : 'Create'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Image upload */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-on-surface">Banner Image {!editTarget && <span className="text-error">*</span>}</label>
          <div
            className="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-outline-variant/50 bg-surface-container/20 hover:border-primary/50 transition-colors"
            onClick={() => document.getElementById('banner-file-input')?.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <>
                <UploadCloud className="h-8 w-8 text-on-surface-variant/50" />
                <p className="text-sm text-on-surface-variant">Click to upload image</p>
              </>
            )}
          </div>
          <input
            id="banner-file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Action Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-on-surface">Action Type</label>
          <select
            value={actionType}
            onChange={e => { setActionType(Number(e.target.value)); setCategoryId(''); setProductId(''); }}
            className="h-10 w-full rounded-xl border border-outline-variant/40 bg-surface px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {actionTypes.map(at => (
              <option key={at.value} value={at.value}>{at.name}</option>
            ))}
          </select>
        </div>

        {/* Category (shown for all except Product type) */}
        {(actionType !== 3) && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface">
              Category {actionType === 2 ? <span className="text-error">*</span> : null}
            </label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              required={actionType === 2}
              className="h-10 w-full rounded-xl border border-outline-variant/40 bg-surface px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{actionType === 2 ? 'Select category...' : 'None'}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Product (shown only for Product action type) */}
        {actionType === 3 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface">Product <span className="text-error">*</span></label>
            <select
              value={productId}
              onChange={e => setProductId(e.target.value)}
              required
              className="h-10 w-full rounded-xl border border-outline-variant/40 bg-surface px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Sort order */}
        <Input
          label="Sort Order"
          type="number"
          value={sortOrder}
          onChange={e => setSortOrder(Number(e.target.value))}
          min={0}
        />

        {/* Active toggle */}
        <div className="flex items-center justify-between rounded-xl border border-outline-variant/30 px-4 py-3">
          <span className="text-sm font-medium text-on-surface">Active</span>
          <ToggleSwitch checked={isActive} onChange={setIsActive} />
        </div>
      </form>
    </FormDrawer>
  );
}

// ---------------------------------------------------------------------------
// BannersPage (main)
// ---------------------------------------------------------------------------
export function BannersPage() {
  usePageTitle('banners');
  const { t } = useTranslation();
  const { toasts, show, dismiss } = useToast();

  const { data: banners, isLoading, refetch } = useAsync(getBanners, []);
  const { data: categoriesData } = useAsync(getCategories, []);
  const { data: actionTypesData } = useAsync(getActionTypes, []);
  const { data: productsData } = useAsync(() => getProducts({ pageSize: 200, isActive: true }), []);
  const categories = categoriesData ?? [];
  const actionTypes = actionTypesData ?? [];
  const products = productsData?.items ?? [];

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [categories]);

  const actionTypeMap = useMemo(() => {
    const map: Record<number, string> = {};
    actionTypes.forEach(at => { map[at.value] = at.name; });
    return map;
  }, [actionTypes]);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Banner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [localBanners, setLocalBanners] = useState<Banner[]>([]);

  // Sync local banners when fetched data changes
  useMemo(() => { if (banners) setLocalBanners(banners); }, [banners]);

  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit = (b: Banner) => { setEditTarget(b); setFormOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBanner(deleteTarget.id);
      setLocalBanners(prev => prev.filter(b => b.id !== deleteTarget.id));
      setDeleteTarget(null);
      show('Banner deleted', 'success');
    } catch {
      show('Failed to delete banner', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (banner: Banner) => {
    setTogglingIds(prev => new Set(prev).add(banner.id));
    try {
      const result = await toggleBanner(banner.id);
      setLocalBanners(prev => prev.map(b => b.id === banner.id ? { ...b, isActive: result.isActive } : b));
    } catch {
      show('Failed to toggle banner', 'error');
    } finally {
      setTogglingIds(prev => { const next = new Set(prev); next.delete(banner.id); return next; });
    }
  };

  const totalBanners = localBanners.length;
  const activeBanners = localBanners.filter(b => b.isActive).length;
  const inactiveBanners = totalBanners - activeBanners;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('banners.title')}
        subtitle={t('banners.subtitle')}
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus className="h-4 w-4 me-2" />
            {t('banners.addButton')}
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Banners"
          value={totalBanners}
          icon={<ImageIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Active"
          value={activeBanners}
          icon={<ToggleLeft className="h-5 w-5" />}
          iconBg="bg-success/10 text-success"
        />
        <StatCard
          label="Inactive"
          value={inactiveBanners}
          icon={<ToggleLeft className="h-5 w-5" />}
          iconBg="bg-on-surface/10 text-on-surface-variant"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : localBanners.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="h-6 w-6" />}
          title={t('banners.noBanners')}
          description="Add your first banner to get started"
          action={
            <Button variant="primary" onClick={openCreate}>
              <Plus className="h-4 w-4 me-2" /> {t('banners.addButton')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {localBanners.map(banner => (
            <BannerCard
              key={banner.id}
              banner={banner}
              categoryName={categoryMap[banner.categoryId] ?? ''}
              actionTypeName={actionTypeMap[banner.actionType] ?? ''}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onToggle={handleToggle}
              toggling={togglingIds.has(banner.id)}
            />
          ))}
        </div>
      )}

      {/* Banner form drawer */}
      <BannerFormDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refetch}
        editTarget={editTarget}
        categories={categories}
        actionTypes={actionTypes}
        products={products}
        showToast={show}
      />

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={t('common.delete')}
        message={
          <div className="flex flex-col items-center gap-3">
            <p>Are you sure you want to delete this banner? This cannot be undone.</p>
            {deleteTarget && (
              <div className="mt-2 flex flex-col items-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container/20 p-3 w-full">
                {deleteTarget.imageUrl ? (
                  <img src={getFullImageUrl(deleteTarget.imageUrl)} alt="banner" className="h-20 rounded object-contain" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-on-surface-variant/40" />
                )}
                <Badge variant="neutral">{categoryMap[deleteTarget.categoryId] ?? '—'}</Badge>
              </div>
            )}
          </div>
        }
      />

      <ToastList toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
