import { ApiImage } from '@/components/ui/ApiImage';
import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Package, X, RefreshCw } from 'lucide-react';
import { listBanners, saveBanner, listBannerProducts, type Banner, type BannerProduct } from '@/api/banners.api';
import { listInventoryProducts } from '@/api/inventory.api';
import { listAdminCategories } from '@/api/categories.api';
import { ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency } from '@/config/orderStatus';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { AdminCategory } from '@/types';

function errorMessages(error: unknown): string[] {
  return error instanceof ApiError ? [error.message, ...error.errors] : [error instanceof Error ? error.message : 'تعذر تنفيذ الطلب'];
}

function BannerForm({ banner, onClose, onSaved }: { banner: Banner | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(banner?.title ?? '');
  const [url, setUrl] = useState(banner?.url ?? '');
  const [image, setImage] = useState<File>();
  const [active, setActive] = useState(banner?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(String(banner?.sortOrder ?? 0));
  const [productIds, setProductIds] = useState((banner?.productIds ?? []).map(String));
  const [categoryIds, setCategoryIds] = useState((banner?.categoryIds ?? []).map(String));
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [optionsError, setOptionsError] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoadingOptions(true);
    setOptionsError([]);
    const loadProducts = async () => {
      const all = new Map<number, { id: number; name: string }>();
      for (let page = 1; ; page++) {
        const result = await listInventoryProducts({ page, pageSize: 100 });
        const items = result.items ?? [];
        items.forEach(product => all.set(product.id, { id: product.id, name: product.name }));
        if (!cancelled) setProducts([...all.values()]);
        if (cancelled || page >= result.totalPages || !items.length) break;
      }
    };
    const loadCategories = async () => {
      const result = await listAdminCategories();
      if (!cancelled) setCategories(result);
    };
    const reportError = (label: string, error: unknown) => {
      if (!cancelled) setOptionsError(previous => [...previous, label, ...errorMessages(error)]);
    };
    void Promise.allSettled([
      loadProducts().catch(error => reportError('تعذر تحميل المنتجات', error)),
      loadCategories().catch(error => reportError('تعذر تحميل الفئات', error)),
    ]).finally(() => { if (!cancelled) setLoadingOptions(false); });
    return () => { cancelled = true; };
  }, [retry]);
  const cannotClear = !!banner && (((banner.productIds ?? []).length > 0 && productIds.length === 0) || ((banner.categoryIds ?? []).length > 0 && categoryIds.length === 0));
  const submit = async () => {
    if (pending.current) return;
    const issues: string[] = [];
    if (!title.trim()) issues.push('عنوان البانر مطلوب');
    if (!banner && !image) issues.push('صورة البانر مطلوبة عند الإضافة');
    if (!sortOrder.trim() || !Number.isInteger(Number(sortOrder)) || Number(sortOrder) < 0) issues.push('ترتيب العرض يجب أن يكون عددًا صحيحًا غير سالب');
    if (cannotClear) issues.push('حذف جميع المنتجات أو الفئات المرتبطة يحتاج دعمًا من الخادم. احتفظ باختيار واحد على الأقل أو ألغِ التعديل.');
    setErrors(issues);
    if (issues.length) return;
    pending.current = true;
    setSaving(true);
    try {
      await saveBanner({ title: title.trim(), url: url.trim(), isActive: active, sortOrder: Number(sortOrder), productIds: productIds.map(Number), categoryIds: categoryIds.map(Number) }, image, banner?.id);
    } catch (error) { setErrors(errorMessages(error)); return; }
    finally { pending.current = false; setSaving(false); }
    onSaved();
  };
  const choices = (ids: string[], options: { value: string; label: string }[], change: (ids: string[]) => void) => <div className="flex flex-wrap gap-2">{ids.map(id => <span key={id} className="inline-flex max-w-full items-center gap-1 rounded-lg bg-primary-surface px-2 py-1 text-sm"><span className="break-words">{options.find(option => option.value === id)?.label ?? `#${id}`}</span><button type="button" disabled={saving} title="إزالة الاختيار" aria-label="إزالة الاختيار" onClick={() => change(ids.filter(value => value !== id))}><X className="h-4 w-4" /></button></span>)}</div>;
  const productOptions = products.map(product => ({ value: String(product.id), label: product.name }));
  const categoryOptions = categories.map(category => ({ value: String(category.id), label: category.name }));
  return <Modal open onClose={() => { if (!pending.current) onClose(); }} title={banner ? 'تعديل البانر' : 'إضافة بانر'} size="lg">
    <form dir="rtl" className="max-h-[75vh] overflow-y-auto flex flex-col gap-4" onSubmit={event => { event.preventDefault(); void submit(); }}>
      <Input label="العنوان" value={title} disabled={saving} onChange={event => setTitle(event.target.value)} />
      <Input label="الرابط" value={url} dir="ltr" disabled={saving} onChange={event => setUrl(event.target.value)} />
      {banner?.image && <ApiImage src={banner.image} alt={banner.title} className="h-28 w-full object-contain" />}
      <Input label={banner ? 'الصورة (اختياري)' : 'الصورة'} type="file" accept="image/*" disabled={saving} onChange={event => setImage(event.target.files?.[0])} />
      <Input label="ترتيب العرض" type="number" min={0} value={sortOrder} disabled={saving} onChange={event => setSortOrder(event.target.value)} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} disabled={saving} onChange={event => setActive(event.target.checked)} />نشط</label>
      {loadingOptions && <p role="status">جاري تحميل المنتجات والفئات...</p>}
      {optionsError.length > 0 && <div role="alert" className="text-error text-sm">{optionsError.map((error, index) => <p key={index}>{error}</p>)}<Button type="button" variant="secondary" onClick={() => setRetry(value => value + 1)}>إعادة تحميل الاختيارات</Button></div>}
      <fieldset disabled={saving} className={saving ? 'pointer-events-none opacity-60' : ''}>
        <div className="flex flex-col gap-3">
          <MultiSelect label="المنتجات (اختياري)" options={productOptions} value={productIds} onChange={setProductIds} searchable placeholder="اختر المنتجات" searchPlaceholder="بحث باسم المنتج" noResultsText="لا توجد منتجات" />
          {choices(productIds, productOptions, setProductIds)}
          <MultiSelect label="الفئات (اختياري)" options={categoryOptions} value={categoryIds} onChange={setCategoryIds} searchable placeholder="اختر الفئات" searchPlaceholder="بحث باسم الفئة" noResultsText="لا توجد فئات" />
          {choices(categoryIds, categoryOptions, setCategoryIds)}
        </div>
      </fieldset>
      {cannotClear && <p role="alert" className="text-sm text-error">لا يمكن حفظ إزالة جميع اختيارات قائمة موجودة حاليًا؛ الخادم سيحتفظ بالقائمة القديمة.</p>}
      {errors.length > 0 && <div role="alert" className="text-error text-sm">{errors.map((error, index) => <p key={index}>{error}</p>)}</div>}
      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" disabled={saving} onClick={onClose}>إلغاء</Button><Button type="submit" loading={saving} disabled={cannotClear}>حفظ</Button></div>
    </form>
  </Modal>;
}

function BannerProducts({ banner, onClose }: { banner: Banner; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<BannerProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setErrors([]); setItems([]);
    void listBannerProducts(banner.id, page).then(result => {
      if (!cancelled) { setItems(result.items); setTotal(result.totalCount); setPages(Math.max(1, result.totalPages)); }
    }).catch(error => { if (!cancelled) setErrors(error instanceof ApiError && error.status === 404 ? ['البانر غير موجود أو غير نشط'] : errorMessages(error)); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [banner.id, page, retry]);
  return <Modal open onClose={onClose} title={`منتجات البانر: ${banner.title}`} size="lg"><div dir="rtl" className="max-h-[70vh] overflow-y-auto">
    {loading ? <p role="status">جاري التحميل...</p> : errors.length ? <div role="alert">{errors.map((error, index) => <p key={index} className="text-error">{error}</p>)}<Button variant="secondary" onClick={() => setRetry(value => value + 1)}>إعادة المحاولة</Button></div> : <>
      <p className="mb-3 text-sm">عدد المنتجات: {total}</p>
      {!items.length ? <p className="py-10 text-center">لا توجد منتجات مرتبطة بهذا البانر</p> : <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-sm text-start"><thead><tr>{['الصورة', 'المنتج', 'السعر', 'بعد الخصم', 'المخزون', 'التوفر'].map(label => <th className="p-2 text-start" key={label}>{label}</th>)}</tr></thead><tbody>{items.map(product => <tr key={product.id} className="border-t border-outline-variant/40"><td className="p-2">{product.image ? <ApiImage src={product.image} alt={product.name} className="h-12 w-12 object-contain" /> : '—'}</td><td className="p-2">{product.name}</td><td className="p-2">{formatCurrency(product.price)}</td><td className="p-2">{formatCurrency(product.priceAfterDiscount ?? product.price)}</td><td className="p-2">{product.stock ?? product.stockQuantity ?? '—'}</td><td className="p-2">{(product.isAvailable ?? product.available) ? 'متوفر' : 'غير متوفر'}</td></tr>)}</tbody></table></div>}
      <Pagination currentPage={page} totalPages={pages} onPageChange={setPage} />
    </>}
  </div></Modal>;
}

export function BannersPage() {
  usePageTitle('البانرات');
  const [rows, setRows] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<{ banner: Banner | null } | null>(null);
  const [viewing, setViewing] = useState<Banner | null>(null);
  const [revision, setRevision] = useState(0);
  const { show } = useToast();
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setErrors([]);
    void listBanners().then(result => { if (!cancelled) setRows(result); }).catch(error => { if (!cancelled) setErrors(errorMessages(error)); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [revision]);
  return <div dir="rtl"><PageHeader title="البانرات" subtitle="إدارة بانرات التطبيق" actions={<div className="flex flex-wrap gap-2"><Button onClick={() => setForm({ banner: null })}><Plus className="h-4 w-4" />إضافة بانر</Button><Button variant="secondary" title="تحديث" aria-label="تحديث" onClick={() => setRevision(value => value + 1)}><RefreshCw className="h-4 w-4" /></Button></div>} />
    {loading ? <p role="status">جاري التحميل...</p> : errors.length ? <div role="alert">{errors.map((error, index) => <p key={index} className="text-error">{error}</p>)}</div> : !rows.length ? <p className="py-12 text-center">لا توجد بانرات</p> : <div className="overflow-x-auto"><table className="w-full min-w-[580px] text-sm"><thead><tr>{['الصورة', 'العنوان', 'الحالة', 'الترتيب', 'إجراءات'].map(label => <th className="p-3 text-start" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(banner => <tr key={banner.id} className="border-t border-outline-variant/40"><td className="p-3"><ApiImage src={banner.image} alt={banner.title} className="h-16 w-28 object-contain" /></td><td className="p-3">{banner.title}</td><td className="p-3">{banner.isActive ? 'نشط' : 'غير نشط'}</td><td className="p-3">{banner.sortOrder}</td><td className="p-3"><div className="flex gap-2"><Button size="icon" variant="ghost" title="تعديل" aria-label="تعديل" onClick={() => setForm({ banner })}><Pencil className="h-4 w-4" /></Button><Button variant="secondary" size="sm" onClick={() => setViewing(banner)}><Package className="h-4 w-4" />عرض منتجات البانر</Button></div></td></tr>)}</tbody></table></div>}
    {form && <BannerForm banner={form.banner} onClose={() => setForm(null)} onSaved={() => { setForm(null); show('تم حفظ البانر بنجاح', 'success'); setRevision(value => value + 1); }} />}
    {viewing && <BannerProducts banner={viewing} onClose={() => setViewing(null)} />}
  </div>;
}
