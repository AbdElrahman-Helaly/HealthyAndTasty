import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Tag, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { SearchFilters, SelectFilter } from '@/components/shared/SearchFilters';
import { FormDrawer } from '@/components/shared/FormDrawer';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSkeleton } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/Modal';
import { ToastList } from '@/components/ui/ToastList';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/hooks/useToast';
import { useAsync } from '@/hooks/useAsync';
import { getProducts } from '@/services/productsApi';
import { getCategories } from '@/services/categoriesApi';
import {
  getDiscounts,
  getDiscountTypes,
  getDiscountTargets,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  toggleDiscount,
} from '@/services/discountsApi';
import type { Discount, DiscountTypeOption, DiscountTargetOption, CreateDiscountBody } from '@/types';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

// ---------------------------------------------------------------------------
// Lightweight MultiSelect Component
// ---------------------------------------------------------------------------
function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { id: string; name: string }[];
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="flex min-h-[48px] cursor-pointer items-center justify-between rounded-2xl border border-[#DDD6FE] bg-[#F9FAFF] px-3 py-2 text-sm text-on-surface focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">
          {value.length === 0
            ? placeholder || '-- اختر --'
            : value.length === 1
            ? options.find((o) => o.id === value[0])?.name || value[0]
            : `تم اختيار ${value.length}`}
        </span>
        <svg className="h-4 w-4 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {open && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-outline-variant bg-surface py-1 shadow-lg">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-on-surface-variant">لا توجد خيارات</div>
          ) : (
            options.map((opt) => {
              const isSelected = value.includes(opt.id);
  const typeLabels: Record<string, string> = {
    Percentage: 'نسبة مئوية',
    FixedAmount: 'قيمة ثابتة',
    BuyXGetY: 'اشتر X واحصل على Y',
    Bundle: 'حزمة منتجات',
    FreeShipping: 'شحن مجاني',
    Tiered: 'متدرج',
  };

  const targetLabels: Record<string, string> = {
    AllProducts: 'جميع المنتجات',
    SpecificProducts: 'منتجات محددة',
    SpecificCategories: 'فئات محددة',
    OrderLevel: 'مستوى الطلب',
  };
                <label
                  key={opt.id}
                  className="flex cursor-pointer items-center px-3 py-2 hover:bg-surface-container/50"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange([...value, opt.id]);
                      } else {
                        onChange(value.filter((id) => id !== opt.id));
                      }
                    }}
                  />
                  <span className="ms-2 text-sm text-on-surface">{opt.name}</span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Discount Form Drawer
// ---------------------------------------------------------------------------
interface DiscountFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editTarget: Discount | null;
  types: DiscountTypeOption[];
  targets: DiscountTargetOption[];
  products: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  showToast: (msg: string, variant?: 'success' | 'error' | 'info') => void;
}

function DiscountFormDrawer({
  open,
  onClose,
  onSaved,
  editTarget,
  types,
  targets,
  products,
  categories,
  showToast,
}: DiscountFormDrawerProps) {
  const { t } = useTranslation();
  const isEdit = editTarget !== null;

  // Form State
  const [name, setName] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [typeValue, setTypeValue] = useState<number>(0);
  const [value, setValue] = useState<number>(0);
  const [targetValue, setTargetValue] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usageLimit, setUsageLimit] = useState<number>(0);
  const [perUserLimit, setPerUserLimit] = useState<number>(0);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [ruleConfigurationJson, setRuleConfigurationJson] = useState('');
  const [productIds, setProductIds] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const isDirtyRef = useRef(false);

  function markDirty() {
    isDirtyRef.current = true;
  }

  function handleCloseRequest() {
    if (isDirtyRef.current) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  }

  useEffect(() => {
    if (editTarget) {
      setName(editTarget.name);
      setCouponCode(editTarget.couponCode || '');
      setTypeValue(editTarget.type.value);
      setValue(editTarget.value);
      setTargetValue(editTarget.target.value);
      setStartDate(editTarget.startDate.slice(0, 16)); // format for datetime-local
      setEndDate(editTarget.endDate.slice(0, 16));
      setUsageLimit(editTarget.usageLimit);
      setPerUserLimit(editTarget.perUserLimit);
      setMinOrderAmount(editTarget.minOrderAmount);
      setMaxDiscountAmount(editTarget.maxDiscountAmount);
      setIsActive(editTarget.isActive);
      setRuleConfigurationJson(editTarget.ruleConfigurationJson || '');
      setProductIds(editTarget.productIds || []);
      setCategoryIds(editTarget.categoryIds || []);
    } else {
      setName('');
      setCouponCode('');
      setTypeValue(types.length > 0 ? types[0].value : 0);
      setValue(0);
      setTargetValue(targets.length > 0 ? targets[0].value : 0);
      setStartDate('');
      setEndDate('');
      setUsageLimit(0);
      setPerUserLimit(0);
      setMinOrderAmount(0);
      setMaxDiscountAmount(0);
      setIsActive(true);
      setRuleConfigurationJson('');
      setProductIds([]);
      setCategoryIds([]);
    }
    setFieldErrors({});
    setAdvancedOpen(false);
    isDirtyRef.current = false;
  }, [editTarget, open, types, targets]);

  const selectedTypeObj = types.find((t) => t.value === typeValue);
  const selectedTargetObj = targets.find((t) => t.value === targetValue);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'الاسم مطلوب';
    if (!typeValue && typeValue !== 0) errs.typeValue = 'النوع مطلوب';
    if (!value && value !== 0) errs.value = 'القيمة مطلوبة';
    if (!targetValue && targetValue !== 0) errs.targetValue = 'الهدف مطلوب';
    if (!startDate) errs.startDate = 'تاريخ البدء مطلوب';
    if (!endDate) errs.endDate = 'تاريخ الانتهاء مطلوب';
    
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      errs.dateError = t('discounts.dateValidationError');
    }
    if (!isEdit && startDate && new Date(startDate) < new Date()) {
      errs.startDate = 'تاريخ البدء لا يمكن أن يكون في الماضي';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    
    setSaving(true);
    try {
      const body: CreateDiscountBody = {
        name,
        type: typeValue,
        value,
        target: targetValue,
        couponCode: couponCode || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        usageLimit,
        perUserLimit,
        minOrderAmount,
        maxDiscountAmount,
        ruleConfigurationJson: ruleConfigurationJson || undefined,
        productIds: selectedTargetObj?.name === 'SpecificProducts' ? productIds : [],
        categoryIds: selectedTargetObj?.name === 'SpecificCategories' ? categoryIds : [],
      };

      if (isEdit && editTarget) {
        await updateDiscount(editTarget.id, { ...body, isActive });
        showToast(t('discounts.updateSuccess'), 'success');
      } else {
        await createDiscount(body);
        showToast(t('discounts.createSuccess'), 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const msg = err?.payload?.message || err?.payload?.error || err?.message || '';
      if (msg.toLowerCase().includes('duplicate coupon') || msg.toLowerCase().includes('already exists')) {
        showToast('كود الخصم مستخدم بالفعل', 'error');
      } else if (msg) {
        showToast(msg, 'error');
      } else {
        showToast(t('discounts.errorGeneric'), 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  const typeLabels: Record<string, string> = {
    Percentage: 'نسبة مئوية',
    FixedAmount: 'قيمة ثابتة',
    BuyXGetY: 'اشتر X واحصل على Y',
    Bundle: 'حزمة منتجات',
    FreeShipping: 'شحن مجاني',
    Tiered: 'متدرج',
  };

  const targetLabels: Record<string, string> = {
    AllProducts: 'جميع المنتجات',
    SpecificProducts: 'منتجات محددة',
    SpecificCategories: 'فئات محددة',
    OrderLevel: 'مستوى الطلب',
  };

  return (
    <FormDrawer
      open={open}
      onClose={handleCloseRequest}
      title={isEdit ? t('discounts.editButton') : t('discounts.addButton')}
      footer={
        <div className="flex justify-end gap-3 w-full">
          {fieldErrors.dateError && (
            <div className="flex-1 text-sm text-error self-center">{fieldErrors.dateError}</div>
          )}
          <Button variant="secondary" type="button" onClick={handleCloseRequest}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="discount-form" loading={saving}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <form id="discount-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex flex-col gap-6">

        {/* Confirm Close Dialog */}
        <ConfirmDialog
          open={showConfirmClose}
          onClose={() => setShowConfirmClose(false)}
          onConfirm={() => {
            setShowConfirmClose(false);
            onClose();
          }}
          title="تنبيه"
          message="لديك تغييرات غير محفوظة، هل تريد إغلاق النموذج؟"
        />

        {/* Type & Value */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-on-surface">{t('discounts.fields.type')}</h3>
          <select
            value={typeValue}
            onChange={(e) => {
              const val = Number(e.target.value);
              setTypeValue(val);
              markDirty();
              if (val === 4) { setTargetValue(2); } // Bundle → SpecificProducts
              if (val === 5) { setTargetValue(4); } // FreeShipping → OrderLevel
            }}
            className={`h-[48px] rounded-2xl border px-3 text-sm focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)] ${fieldErrors.typeValue ? 'border-error' : 'border-[#DDD6FE] bg-[#F9FAFF]'}`}
          >
            {types.map(t => <option key={t.value} value={t.value}>{typeLabels[t.name] || t.name}</option>)}
          </select>

          <Input
            label={
              selectedTypeObj?.name === 'Percentage' ? 'نسبة الخصم (%)' :
              selectedTypeObj?.name === 'FixedAmount' ? 'قيمة الخصم (رس)' :
              selectedTypeObj?.name === 'FreeShipping' ? 'قيمة الطلب المؤهلة (رس)' :
              t('discounts.fields.value')
            }
            type="number"
            min={0}
            max={selectedTypeObj?.name === 'Percentage' ? 100 : undefined}
            value={String(value)}
            onChange={(e) => { setValue(Number(e.target.value)); markDirty(); }}
            error={fieldErrors.value}
            required
          />
        </div>

        <hr className="border-outline-variant/30" />

        {/* Basic Info */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-on-surface">{t('discounts.sections.basicInfo')}</h3>

          <Input
            label={t('discounts.fields.name')}
            value={name}
            onChange={(e) => { setName(e.target.value); markDirty(); }}
            error={fieldErrors.name}
            required
          />

          <Input
            label={t('discounts.fields.couponCode')}
            value={couponCode}
            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); markDirty(); }}
            placeholder="مثال: SUMMER20"
          />
        </div>

        <hr className="border-outline-variant/30" />

        {/* Target */}
        {selectedTypeObj?.name !== 'FreeShipping' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-on-surface">{t('discounts.sections.target')}</h3>

            <select
              value={targetValue}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTargetValue(val);
                markDirty();
                const selected = targets.find(t => t.value === val);
                if (selected?.name !== 'SpecificProducts') setProductIds([]);
                if (selected?.name !== 'SpecificCategories') setCategoryIds([]);
              }}
              className={`h-[48px] rounded-2xl border px-3 text-sm focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)] ${fieldErrors.targetValue ? 'border-error' : 'border-[#DDD6FE] bg-[#F9FAFF]'}`}
            >
              {targets.map(t => <option key={t.value} value={t.value}>{targetLabels[t.name] || t.name}</option>)}
            </select>

            {selectedTargetObj?.name === 'SpecificProducts' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-on-surface">{t('discounts.fields.productIds')}</label>
                <MultiSelect
                  options={products}
                  value={productIds}
                  onChange={(val) => { setProductIds(val); markDirty(); }}
                />
              </div>
            )}

            {selectedTargetObj?.name === 'SpecificCategories' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-on-surface">{t('discounts.fields.categoryIds')}</label>
                <MultiSelect
                  options={categories}
                  value={categoryIds}
                  onChange={(val) => { setCategoryIds(val); markDirty(); }}
                />
              </div>
            )}
          </div>
        )}

        {selectedTypeObj?.name === 'Bundle' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface">{t('discounts.fields.productIds')}</label>
            <MultiSelect
              options={products}
              value={productIds}
              onChange={(val) => { setProductIds(val); markDirty(); }}
            />
          </div>
        )}

        <hr className="border-outline-variant/30" />

        {/* Dates */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-on-surface">{t('discounts.sections.validityPeriod')}</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('discounts.fields.startDate')}
              type="datetime-local"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); markDirty(); }}
              error={fieldErrors.startDate}
              required
            />
            <Input
              label={t('discounts.fields.endDate')}
              type="datetime-local"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); markDirty(); }}
              error={fieldErrors.endDate}
              required
            />
          </div>
        </div>

        <hr className="border-outline-variant/30" />

        {/* Limits */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-on-surface">{t('discounts.sections.limitsAndRestrictions')}</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Input
                label={t('discounts.fields.usageLimit')}
                type="number"
                min={0}
                value={String(usageLimit)}
                onChange={(e) => { setUsageLimit(Number(e.target.value)); markDirty(); }}
              />
              <span className="text-xs text-on-surface-variant px-1">{t('discounts.unlimitedHint')}</span>
            </div>

            <div className="flex flex-col gap-1">
              <Input
                label={t('discounts.fields.perUserLimit')}
                type="number"
                min={0}
                value={String(perUserLimit)}
                onChange={(e) => { setPerUserLimit(Number(e.target.value)); markDirty(); }}
              />
              <span className="text-xs text-on-surface-variant px-1">{t('discounts.unlimitedHint')}</span>
            </div>

            <Input
              label={t('discounts.fields.minOrderAmount')}
              type="number"
              min={0}
              value={String(minOrderAmount)}
              onChange={(e) => { setMinOrderAmount(Number(e.target.value)); markDirty(); }}
            />

            <Input
              label={t('discounts.fields.maxDiscountAmount')}
              type="number"
              min={0}
              value={String(maxDiscountAmount)}
              onChange={(e) => { setMaxDiscountAmount(Number(e.target.value)); markDirty(); }}
            />
          </div>

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container/30 px-4 py-3 mt-2">
              <span className="text-sm font-medium text-on-surface">
                {t('discounts.fields.isActive')}
              </span>
              <ToggleSwitch checked={isActive} onChange={(val) => { setIsActive(val); markDirty(); }} aria-label={t('discounts.fields.isActive')} />
            </div>
          )}
        </div>

        <hr className="border-outline-variant/30" />

        {/* Advanced Section */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex items-center justify-between text-lg font-semibold text-on-surface w-full py-2"
          >
            {t('discounts.sections.advancedSettings')}
            <svg
              className={`h-5 w-5 transform transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {advancedOpen && (
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-sm font-medium text-on-surface">
                {t('discounts.fields.ruleConfigurationJson')}
              </label>
              <textarea
                value={ruleConfigurationJson}
                onChange={(e) => { setRuleConfigurationJson(e.target.value); markDirty(); }}
                className="h-32 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder='{"advanced_rule": true}'
              />
            </div>
          )}
        </div>

      </form>
    </FormDrawer>
  );
}

// ---------------------------------------------------------------------------
// Main DiscountsPage
// ---------------------------------------------------------------------------
export function DiscountsPage() {
  const { t, i18n } = useTranslation();
  usePageTitle(t('discounts.title'));
  const { toasts, show: showToast, dismiss } = useToast();

  const { data: discounts, isLoading, error, refetch } = useAsync(getDiscounts, []);
  const { data: types } = useAsync(getDiscountTypes, []);
  const { data: targets } = useAsync(getDiscountTargets, []);
  
  // Products/Categories for lookups
  const { data: productsData } = useAsync(() => getProducts({ pageSize: 100 }), []);
  const { data: categoriesData } = useAsync(() => getCategories({ pageSize: 50 }), []);

  const productsList = useMemo(() => {
    return (productsData?.items || []).map(p => ({
      id: p.id,
      name: i18n.language === 'ar' ? p.nameAr || p.name : p.name
    }));
  }, [productsData, i18n.language]);

  const categoriesList = useMemo(() => {
    return (categoriesData || []).map(c => ({
      id: c.id,
      name: i18n.language === 'ar' ? c.nameAr || c.name : c.name
    }));
  }, [categoriesData, i18n.language]);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Discount | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Optimistic Toggling
  const [localDiscounts, setLocalDiscounts] = useState<Discount[] | undefined>(undefined);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');

  useEffect(() => {
    if (discounts) setLocalDiscounts(discounts);
  }, [discounts]);

  const handleToggle = useCallback(async (discount: Discount, newCheckedState: boolean) => {
    if (togglingIds.has(discount.id)) return;
    const previousState = discount.isActive;
    
    setLocalDiscounts((prev) => prev ? prev.map((d) => d.id === discount.id ? { ...d, isActive: newCheckedState } : d) : prev);
    setTogglingIds((s) => new Set(s).add(discount.id));
    
    try {
      const result = await toggleDiscount(discount.id);
      
      const confirmedState = result && typeof result.isActive === 'boolean' 
        ? result.isActive 
        : newCheckedState;
        
      setLocalDiscounts((prev) => prev ? prev.map((d) => d.id === discount.id ? { ...d, isActive: confirmedState } : d) : prev);
    } catch {
      setLocalDiscounts((prev) => prev ? prev.map((d) => d.id === discount.id ? { ...d, isActive: previousState } : d) : prev);
      showToast(t('discounts.errorGeneric'), 'error');
    } finally {
      setTogglingIds((s) => {
        const next = new Set(s);
        next.delete(discount.id);
        return next;
      });
    }
  }, [togglingIds, showToast, t]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDiscount(deleteTarget.id);
      showToast(t('discounts.deleteSuccess'), 'success');
      setDeleteTarget(null);
      refetch();
    } catch {
      showToast(t('discounts.errorGeneric'), 'error');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, refetch, showToast, t]);

  const displayDiscounts = useMemo(() => {
    let result = localDiscounts ?? discounts ?? [];
    
    // Apply Status Filter
    if (statusFilter !== 'all') {
      const now = new Date();
      result = result.filter(d => {
        const isExpired = new Date(d.endDate) < now;
        if (statusFilter === 'active') return d.isActive && !isExpired;
        if (statusFilter === 'inactive') return !d.isActive && !isExpired;
        if (statusFilter === 'expired') return isExpired;
        return true;
      });
    }

    // Apply Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.name.toLowerCase().includes(q) || 
        (d.couponCode && d.couponCode.toLowerCase().includes(q))
      );
    }

    return result;
  }, [localDiscounts, discounts, statusFilter, searchQuery]);

  const columns: Column<Discount>[] = [
    {
      key: 'name_code',
      header: t('discounts.fields.name') + ' / ' + t('discounts.fields.couponCode'),
      render: (d) => (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-on-surface">{d.name}</span>
          <div className="flex items-center gap-2 text-xs">
            {d.couponCode ? (
              <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 font-mono font-bold tracking-wide text-primary">
                {d.couponCode}
              </span>
            ) : (
              <span className="text-on-surface-variant/50">—</span>
            )}
            <span className="text-on-surface-variant/70">
              الاستخدام: {d.usageCount} / {d.usageLimit === 0 ? '∞' : d.usageLimit}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'type_value',
      header: t('discounts.fields.value'),
      render: (d) => {
        const isPercentage = d.type.name === 'Percentage';
        return (
          <div className="flex items-center gap-1.5 font-medium">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${isPercentage ? 'bg-info/10 text-info' : 'bg-success/10 text-success'}`}>
              {t(`discounts.typeLabels.${d.type.name}` as any) || d.type.name}
            </span>
            <span className="text-on-surface">
              {isPercentage ? `${d.value}%` : d.value}
            </span>
          </div>
        );
      },
    },
    {
      key: 'target',
      header: t('discounts.fields.target'),
      render: (d) => <span className="text-sm font-medium text-on-surface-variant">{t(`discounts.targetLabels.${d.target.name}` as any) || d.target.name}</span>,
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (d) => {
        const isExpired = new Date(d.endDate) < new Date();
        if (isExpired) {
          return (
            <div className="flex items-center gap-1.5 rounded-full bg-warning/10 px-2 py-1 text-xs font-bold text-warning-dark w-fit">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              {t('discounts.status.expired')}
            </div>
          );
        }
        if (d.isActive) {
          return (
            <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-1 text-xs font-bold text-success w-fit">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {t('discounts.status.active')}
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1.5 rounded-full bg-surface-container-high px-2 py-1 text-xs font-bold text-on-surface-variant w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-on-surface-variant" />
            {t('discounts.status.inactive')}
          </div>
        );
      },
    },
    {
      key: 'endDate',
      header: t('discounts.fields.endDate'),
      render: (d) => {
        const isExpired = new Date(d.endDate) < new Date();
        return (
          <div className={`flex items-center gap-1.5 text-xs font-medium ${isExpired ? 'text-error' : 'text-on-surface-variant'}`}>
            <Clock className="h-3.5 w-3.5" />
            {new Date(d.endDate).toLocaleDateString()}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (d) => (
        <div className="flex items-center gap-1.5">
          <ToggleSwitch checked={d.isActive} onChange={(checked) => handleToggle(d, checked)} disabled={togglingIds.has(d.id)} aria-label={t('discounts.fields.isActive') || 'Toggle Discount'} />
          <div className="w-px h-4 bg-outline-variant/50 mx-0.5" />
          <Button variant="ghost" size="icon" onClick={() => { setEditTarget(d); setFormOpen(true); }} className="h-8 w-8 text-on-surface-variant hover:text-primary hover:bg-primary-surface" title="تعديل الخصم" aria-label={`تعديل الخصم ${d.name}`}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(d)} className="h-8 w-8 text-on-surface-variant hover:text-error hover:bg-error/10" title="حذف الخصم" aria-label={`حذف الخصم ${d.name}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('discounts.title')}
        subtitle={t('discounts.subtitle')}
        actions={
          <Button onClick={() => { setEditTarget(null); setFormOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('discounts.addButton')}
          </Button>
        }
      />
      {/* Stats row */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="إجمالي الخصومات"
            value={discounts?.length || 0}
            icon={<Tag className="h-5 w-5" />}
            iconColor="#7C3AED"
          />
          <StatCard
            label="نشط"
            value={discounts?.filter(d => d.isActive && new Date(d.endDate) >= new Date()).length || 0}
            icon={<CheckCircle2 className="h-5 w-5" />}
            iconColor="#16A34A"
          />
          <StatCard
            label="غير نشط"
            value={discounts?.filter(d => !d.isActive && new Date(d.endDate) >= new Date()).length || 0}
            icon={<XCircle className="h-5 w-5" />}
            iconColor="#64748B"
          />
          <StatCard
            label="منتهي الصلاحية"
            value={discounts?.filter(d => new Date(d.endDate) < new Date()).length || 0}
            icon={<Clock className="h-5 w-5" />}
            iconColor="#D97706"
          />
        </div>
      )}

      {/* Search & Status Filter */}
      <SearchFilters
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="بحث بالاسم أو الكود..."
      >
        <SelectFilter
          label={t('common.status')}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as any)}
          options={[
            { value: 'all', label: 'الكل' },
            { value: 'active', label: t('discounts.status.active') },
            { value: 'inactive', label: t('discounts.status.inactive') },
            { value: 'expired', label: t('discounts.status.expired') },
          ]}
        />
      </SearchFilters>
      <Card padding="none" className="overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton className="h-10 w-full mb-4" />
            <LoadingSkeleton className="h-10 w-full mb-4" />
            <LoadingSkeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-error">{t('discounts.errorGeneric')}</div>
        ) : (
          <DataTable
            columns={columns}
            data={displayDiscounts}
            keyExtractor={(d) => d.id}
            emptyMessage={t('discounts.noDiscounts')}
            emptyState={
              <EmptyState
                icon={<Tag className="h-6 w-6" />}
                title={t('discounts.noDiscounts')}
                action={
                  <Button onClick={() => { setEditTarget(null); setFormOpen(true); }} className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    {t('discounts.addButton')}
                  </Button>
                }
              />
            }
          />
        )}
      </Card>

      <DiscountFormDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refetch}
        editTarget={editTarget}
        types={types ?? []}
        targets={targets ?? []}
        products={productsList}
        categories={categoriesList}
        showToast={showToast}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={t('common.delete')}
        message={`هل أنت متأكد من حذف الخصم "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
      />

      <ToastList toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
