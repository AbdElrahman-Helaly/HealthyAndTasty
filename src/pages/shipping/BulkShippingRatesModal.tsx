import { useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { createBulkShippingRates } from '@/api/shippingRates.api';
import { ApiError } from '@/lib/apiClient';
import type { BranchAdmin } from '@/types';

export function BulkShippingRatesModal({ branches, onClose, onSaved }: {
  branches: BranchAdmin[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [allBranches, setAllBranches] = useState(true);
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [bands, setBands] = useState([{ id: 0, minDistanceKm: '', maxDistanceKm: '', fee: '' }]);
  const nextId = useRef(1);
  const pending = useRef(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const save = async () => {
    if (pending.current) return;
    const issues: string[] = [];
    if (!allBranches && !branchIds.length) issues.push('اختر فرعًا واحدًا على الأقل.');
    const parsed = bands.map((band, index) => {
      const values = [band.minDistanceKm, band.maxDistanceKm, band.fee];
      if (values.some(value => !value.trim() || !Number.isFinite(Number(value)) || Number(value) < 0)) {
        issues.push(`الشريحة ${index + 1}: أدخل مسافات وسعرًا غير سالبين.`);
      }
      const result = { minDistanceKm: Number(band.minDistanceKm), maxDistanceKm: Number(band.maxDistanceKm), fee: Number(band.fee) };
      if (result.maxDistanceKm <= result.minDistanceKm) issues.push(`الشريحة ${index + 1}: نهاية المسافة يجب أن تكون أكبر من بدايتها.`);
      return result;
    });
    if (!parsed.length) issues.push('أضف شريحة واحدة على الأقل.');
    const sorted = [...parsed].sort((a, b) => a.minDistanceKm - b.minDistanceKm);
    if (sorted.some((band, index) => index > 0 && band.minDistanceKm < sorted[index - 1].maxDistanceKm)) {
      issues.push('الشرايح متداخلة؛ راجع حدود المسافات.');
    }
    setErrors(issues);
    if (issues.length) return;
    pending.current = true;
    setSaving(true);
    try {
      await createBulkShippingRates(allBranches
        ? { allBranches: true, bands: parsed }
        : { allBranches: false, branchIds, bands: parsed });
    } catch (error) {
      setErrors(error instanceof ApiError ? [error.message, ...error.errors] : [error instanceof Error ? error.message : 'فشل حفظ الشرايح.']);
      return;
    } finally {
      pending.current = false;
      setSaving(false);
    }
    onSaved();
  };

  return <Modal open onClose={() => { if (!pending.current) onClose(); }} title="إضافة شرايح شحن بسعر ثابت" size="lg">
    <div className="flex flex-col gap-4" dir="rtl">
      <fieldset disabled={saving} className="flex flex-wrap gap-4">
        <legend className="mb-2 text-sm font-semibold">تطبيق على</legend>
        <label className="flex items-center gap-2"><input type="radio" name="shippingScope" checked={allBranches} onChange={() => setAllBranches(true)} />كل الفروع</label>
        <label className="flex items-center gap-2"><input type="radio" name="shippingScope" checked={!allBranches} onChange={() => setAllBranches(false)} />فروع محددة</label>
      </fieldset>
      {!allBranches && <div className={saving ? 'pointer-events-none opacity-60' : ''}>
        <MultiSelect label="الفروع" options={branches.map(branch => ({ value: branch.id, label: branch.name }))} value={branchIds} onChange={setBranchIds} searchable placeholder="اختر الفروع" searchPlaceholder="بحث باسم الفرع" noResultsText="لا توجد فروع" />
      </div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-start text-sm">
          <thead><tr><th className="p-2 text-start">من مسافة (كم)</th><th className="p-2 text-start">إلى مسافة (كم)</th><th className="p-2 text-start">سعر الشحن الثابت (ج.م)</th><th className="p-2"><span className="sr-only">حذف</span></th></tr></thead>
          <tbody>{bands.map((band, index) => <tr key={band.id}>
            {(['minDistanceKm', 'maxDistanceKm', 'fee'] as const).map(key => <td key={key} className="p-1"><Input aria-label={`${key === 'fee' ? 'سعر الشحن الثابت' : key === 'minDistanceKm' ? 'من مسافة' : 'إلى مسافة'} للشريحة ${index + 1}`} type="number" min={0} step="any" disabled={saving} value={band[key]} onChange={event => setBands(previous => previous.map(row => row.id === band.id ? { ...row, [key]: event.target.value } : row))} /></td>)}
            <td className="p-1"><Button variant="ghost" size="icon" title="حذف الشريحة" aria-label="حذف الشريحة" disabled={saving || bands.length === 1} onClick={() => setBands(previous => previous.filter(row => row.id !== band.id))}><Trash2 className="h-4 w-4" /></Button></td>
          </tr>)}</tbody>
        </table>
      </div>
      <Button variant="secondary" disabled={saving} onClick={() => setBands(previous => [...previous, { id: nextId.current++, minDistanceKm: '', maxDistanceKm: '', fee: '' }])}><Plus className="h-4 w-4" />إضافة شريحة</Button>
      {errors.length > 0 && <div role="alert" className="text-sm text-error">{errors.map((error, index) => <p key={index}>{error}</p>)}</div>}
      <div className="flex justify-end gap-3"><Button variant="secondary" disabled={saving} onClick={onClose}>إلغاء</Button><Button loading={saving} onClick={() => void save()}>حفظ</Button></div>
    </div>
  </Modal>;
}
