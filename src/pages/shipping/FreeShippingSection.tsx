import { useCallback, useEffect, useRef, useState } from 'react';
import { Pencil, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { listFreeShipping, saveFreeShipping, type FreeShippingSetting, type FreeShippingRequest } from '@/api/shippingRates.api';
import { ApiError } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';

export function FreeShippingSection() {
  const { show } = useToast();
  const [rows, setRows] = useState<FreeShippingSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [allBranches, setAllBranches] = useState(false);
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [free, setFree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<FreeShippingRequest | null>(null);
  const pending = useRef(false);
  const version = useRef(0);
  const describe = (err: unknown) => err instanceof ApiError ? [err.message, ...err.errors].join('، ') : 'تعذر تنفيذ الطلب';
  const load = useCallback(async () => {
    const current = ++version.current;
    setLoading(true); setLoadError('');
    try { const result = await listFreeShipping(); if (current === version.current) setRows(result); }
    catch (err) { if (current === version.current) setLoadError(describe(err)); }
    finally { if (current === version.current) setLoading(false); }
  }, []);
  useEffect(() => { void load(); return () => { version.current++; }; }, [load]);
  const edit = (row?: FreeShippingSetting) => {
    setAllBranches(false); setBranchIds(row ? [row.branchId] : []); setFree(row?.isFreeShipping ?? false); setError(''); setOpen(true);
  };
  const save = async (body: FreeShippingRequest) => {
    if (pending.current) return;
    pending.current = true; setSaving(true); setError('');
    try { await saveFreeShipping(body); }
    catch (err) { setError(describe(err)); setConfirmation(null); return; }
    finally { pending.current = false; setSaving(false); }
    setConfirmation(null); setOpen(false); show('تم حفظ إعدادات الشحن المجاني', 'success'); void load();
  };
  const submit = () => {
    if (pending.current) return;
    if (!allBranches && !branchIds.length) { setError('اختر فرعًا واحدًا على الأقل'); return; }
    const body: FreeShippingRequest = allBranches ? { allBranches: true, isFreeShipping: free } : { allBranches: false, branchIds, isFreeShipping: free };
    setError('');
    if (allBranches) setConfirmation(body); else void save(body);
  };
  return <section dir="rtl" className="mt-8 border-t border-outline-variant/40 pt-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">الشحن المجاني</h2><div className="flex gap-2"><Button size="sm" disabled={loading || !!loadError || saving} onClick={() => edit()}><Plus className="h-4 w-4" />تعديل الشحن المجاني</Button><Button variant="secondary" size="icon" title="تحديث الشحن المجاني" aria-label="تحديث الشحن المجاني" disabled={loading || saving} onClick={() => void load()}><RefreshCw className="h-4 w-4" /></Button></div></div>
    {loading ? <p role="status">جاري تحميل إعدادات الشحن المجاني...</p> : loadError ? <p role="alert" className="text-error">{loadError}</p> : <div className="overflow-x-auto"><table className="w-full min-w-[360px] text-sm"><thead><tr><th className="p-3 text-start">الفرع</th><th className="p-3 text-start">الشحن المجاني</th><th className="p-3 text-start">إجراءات</th></tr></thead><tbody>{rows.map(row => <tr key={row.branchId} className="border-t border-outline-variant/40"><td className="p-3">{row.branchName}</td><td className="p-3">{row.isFreeShipping ? 'مفعّل' : 'غير مفعّل'}</td><td className="p-3"><Button size="icon" variant="ghost" title="تعديل" aria-label={`تعديل الشحن المجاني: ${row.branchName}`} disabled={saving} onClick={() => edit(row)}><Pencil className="h-4 w-4" /></Button></td></tr>)}</tbody></table>{!rows.length && <p className="py-6 text-center">لا توجد إعدادات فروع</p>}</div>}
    <Modal open={open && confirmation === null} title="إعداد الشحن المجاني" onClose={() => { if (!pending.current) setOpen(false); }}>
      <form dir="rtl" className="flex flex-col gap-4" onSubmit={event => { event.preventDefault(); submit(); }}>
        <fieldset disabled={saving} className={saving ? 'pointer-events-none flex flex-col gap-4' : 'flex flex-col gap-4'}>
          <legend className="mb-3 text-sm font-semibold">نطاق التطبيق</legend>
          <div className="flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="freeShippingScope" checked={!allBranches} onChange={() => setAllBranches(false)} />فروع محددة</label><label className="flex items-center gap-2"><input type="radio" name="freeShippingScope" checked={allBranches} onChange={() => setAllBranches(true)} />كل الفروع</label></div>
          {!allBranches && <MultiSelect label="الفروع" searchable options={rows.map(row => ({ value: row.branchId, label: row.branchName }))} value={branchIds} onChange={setBranchIds} placeholder="اختر الفروع" searchPlaceholder="بحث باسم الفرع" noResultsText="لا توجد فروع" />}
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" role="switch" checked={free} onChange={event => setFree(event.target.checked)} />الشحن المجاني</label>
        </fieldset>
        <p className="text-xs text-on-surface-variant">يسري على الطلبات الجديدة فقط. الشرائح الحالية تظل محفوظة وتُستخدم عند إلغاء المجاني، وحدود نطاق التوصيل لا تتغير.</p>
        {error && <p role="alert" className="text-sm text-error">{error}</p>}
        <div className="flex justify-end gap-3"><Button type="button" variant="secondary" disabled={saving} onClick={() => setOpen(false)}>إلغاء</Button><Button type="submit" loading={saving}>حفظ</Button></div>
      </form>
    </Modal>
    <ConfirmDialog open={confirmation !== null} title="تطبيق الشحن المجاني على كل الفروع" message={`سيتم ${confirmation?.isFreeShipping ? 'تفعيل' : 'إلغاء'} الشحن المجاني لكل الفروع النشطة الحالية فقط. لا يشمل الفروع التي تُضاف مستقبلًا، ولا يغيّر الطلبات القديمة. هل تريد المتابعة؟`} loading={saving} onClose={() => { if (!pending.current) setConfirmation(null); }} onConfirm={() => { if (confirmation) void save(confirmation); }} confirmText="تطبيق" />
  </section>;
}
