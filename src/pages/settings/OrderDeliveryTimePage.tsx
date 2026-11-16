import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, RefreshCw, Save } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/Modal';
import { listBranches } from '@/api/branches.api';
import { deliveryUnitLabels, listOrderDeliveryTimes, saveOrderDeliveryTime, type DeliveryTimeUnit, type OrderDeliveryTime, type SaveDeliveryTimeRequest } from '@/api/orderDeliveryTime.api';
import { ApiError } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/hooks/usePageTitle';

export function OrderDeliveryTimePage() {
  const { t } = useTranslation();
  usePageTitle(t('settings.deliveryTimeTitle'));
  const { show } = useToast();
  const [rows, setRows] = useState<OrderDeliveryTime[]>([]);
  const [activeIds, setActiveIds] = useState<Set<number>>(new Set());
  const [allBranches, setAllBranches] = useState(false);
  const [branchId, setBranchId] = useState('');
  const [search, setSearch] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<DeliveryTimeUnit>('minutes');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<SaveDeliveryTimeRequest | null>(null);
  const pending = useRef(false);
  const version = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const load = useCallback(async () => {
    const current = ++version.current;
    setLoading(true); setLoadError('');
    try {
      const [times, branches] = await Promise.all([listOrderDeliveryTimes(), listBranches()]);
      if (version.current !== current) return;
      setRows(times);
      setActiveIds(new Set(branches.filter(branch => branch.isActive).map(branch => branch.odooBranchId)));
    } catch (error) {
      if (version.current === current) setLoadError(error instanceof ApiError ? [error.message, ...error.errors].join('، ') : 'تعذر تحميل إعدادات الفروع');
    } finally { if (version.current === current) setLoading(false); }
  }, []);
  useEffect(() => { void load(); return () => { version.current++; }; }, [load]);
  const options = rows.filter(row => activeIds.has(row.branchId));
  const save = async (body: SaveDeliveryTimeRequest) => {
    if (pending.current) return;
    pending.current = true; setSaving(true); setErrors([]);
    try { await saveOrderDeliveryTime(body); }
    catch (error) {
      setConfirm(null);
      setErrors(error instanceof ApiError ? [error.message, ...error.errors] : ['تعذر حفظ مدة التوصيل']);
      return;
    } finally { pending.current = false; setSaving(false); }
    setConfirm(null);
    show('تم حفظ مدة التوصيل بنجاح', 'success');
    void load();
  };
  const submit = () => {
    if (pending.current) return;
    const issues: string[] = [];
    const duration = Number(value);
    const limits = { minutes: 365 * 24 * 60, hours: 365 * 24, days: 365 };
    if (!Object.hasOwn(limits, unit)) issues.push('اختر وحدة صحيحة');
    if (!value.trim() || !Number.isInteger(duration) || duration <= 0 || duration > limits[unit]) issues.push('المدة عدد صحيح موجب بحد أقصى ما يعادل 365 يومًا');
    if (!allBranches && !options.some(row => String(row.branchId) === branchId)) issues.push('اختر فرعًا نشطًا');
    setErrors(issues);
    if (issues.length) return;
    const body: SaveDeliveryTimeRequest = allBranches ? { allBranches: true, value: duration, unit } : { allBranches: false, branchId: Number(branchId), value: duration, unit };
    if (allBranches) setConfirm(body); else void save(body);
  };
  return <div dir="rtl">
    <PageHeader title={t('settings.deliveryTimeTitle')} subtitle={t('settings.deliveryTimeSubtitle')} actions={<Button variant="secondary" disabled={loading || saving} onClick={() => void load()}><RefreshCw className="h-4 w-4" />{t('settings.refresh')}</Button>} />
    {loadError && <p role="alert" className="mb-4 text-error">{loadError}</p>}
    <form ref={formRef} className="border-b border-outline-variant/40 pb-6 mb-5" onSubmit={event => { event.preventDefault(); submit(); }}>
      <fieldset disabled={saving || loading || !!loadError || confirm !== null} className="flex flex-col gap-4">
        <legend className="mb-3 text-sm font-semibold">نطاق التطبيق</legend>
        <div className="flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><input type="radio" name="deliveryScope" checked={!allBranches} onChange={() => setAllBranches(false)} />فرع معين</label><label className="flex items-center gap-2"><input type="radio" name="deliveryScope" checked={allBranches} onChange={() => setAllBranches(true)} />كل الفروع</label></div>
        {!allBranches && <div className="max-w-md flex flex-col gap-2"><Input label="بحث عن الفرع" type="search" value={search} onChange={event => setSearch(event.target.value)} /><Select label="الفرع" value={branchId} onChange={event => setBranchId(event.target.value)}><option value="">اختر فرعًا نشطًا</option>{options.filter(row => String(row.branchId) === branchId || row.branchName.toLowerCase().includes(search.trim().toLowerCase())).map(row => <option key={row.branchId} value={row.branchId}>{row.branchName}</option>)}</Select></div>}
        <div className="grid max-w-xl grid-cols-1 sm:grid-cols-2 gap-4"><Input label="مدة التوصيل" type="number" min={1} max={{ minutes: 525600, hours: 8760, days: 365 }[unit]} step={1} value={value} onChange={event => setValue(event.target.value)} /><Select label="الوحدة" value={unit} onChange={event => setUnit(event.target.value as DeliveryTimeUnit)}>{Object.entries(deliveryUnitLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></div>
        {errors.length > 0 && <div role="alert" className="text-sm text-error">{errors.map((error, index) => <p key={index}>{error}</p>)}</div>}
        <div><Button type="submit" loading={saving}><Save className="h-4 w-4" />حفظ</Button></div>
      </fieldset>
    </form>
    {loading ? <p role="status">جاري تحميل إعدادات التوصيل...</p> : !loadError && <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-sm"><thead><tr>{['الفرع', 'المدة الحالية', 'الوحدة', 'إجراءات'].map(label => <th key={label} className="p-3 text-start">{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.branchId} className="border-t border-outline-variant/40"><td className="p-3">{row.branchName}</td><td className="p-3">{row.value ?? 'غير محددة'}</td><td className="p-3">{row.value === null || !row.unit ? '—' : deliveryUnitLabels[row.unit]}</td><td className="p-3"><Button variant="ghost" size="icon" title="تعديل مدة التوصيل" aria-label={`تعديل مدة ${row.branchName}`} disabled={saving || !activeIds.has(row.branchId)} onClick={() => { setAllBranches(false); setSearch(''); setBranchId(String(row.branchId)); setValue(row.value === null ? '' : String(row.value)); setUnit(row.unit ?? 'minutes'); setErrors([]); formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><Pencil className="h-4 w-4" /></Button></td></tr>)}</tbody></table>{!rows.length && <p className="py-8 text-center">لا توجد فروع</p>}</div>}
    <ConfirmDialog open={confirm !== null} onClose={() => { if (!pending.current) setConfirm(null); }} onConfirm={() => { if (confirm) void save(confirm); }} loading={saving} title="تطبيق مدة التوصيل على كل الفروع" message="سيتم استبدال المدة الحالية لكل الفروع النشطة الموجودة الآن. لن يشمل هذا الإعداد الفروع التي تُضاف مستقبلًا. هل تريد المتابعة؟" confirmText="تطبيق على كل الفروع" />
  </div>;
}
