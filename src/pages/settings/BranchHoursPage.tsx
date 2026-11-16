import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Eye, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ApiError } from '@/lib/apiClient';
import { weekDays, listBranchHours, getBranchHours, saveBranchHours, type BranchHours, type ScheduleDay, type SaveBranchHours } from '@/api/branchHours.api';

const blankSchedule = (): ScheduleDay[] => weekDays.map(([day]) => ({ day, isClosed: false, openTime: '', closeTime: '' }));
const message = (error: unknown) => error instanceof ApiError ? [error.message, ...error.errors].join('، ') : 'تعذر تنفيذ الطلب';

export function BranchHoursPage() {
  const { t } = useTranslation();
  usePageTitle(t('settings.branchHoursTitle'));
  const { user } = useAuth();
  const { show } = useToast();
  const canEdit = ['admin', 'generalmanager'].includes(user?.role.toLowerCase() ?? '');
  const [rows, setRows] = useState<BranchHours[]>([]);
  const [allBranches, setAllBranches] = useState(false);
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<ScheduleDay[]>(blankSchedule);
  const [loadedBranch, setLoadedBranch] = useState<BranchHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [confirm, setConfirm] = useState<SaveBranchHours | null>(null);
  const pending = useRef(false);
  const detailVersion = useRef(0);
  const loadVersion = useRef(0);
  const form = useRef<HTMLFormElement>(null);
  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true); setLoadError('');
    try { const result = await listBranchHours(); if (version === loadVersion.current) setRows(result); }
    catch (err) { if (version === loadVersion.current) setLoadError(message(err)); }
    finally { if (version === loadVersion.current) setLoading(false); }
  }, []);
  useEffect(() => { void load(); return () => { loadVersion.current++; detailVersion.current++; }; }, [load]);
  const view = async (id: string) => {
    const version = ++detailVersion.current;
    setDetailLoading(true); setError('');
    try {
      const result = await getBranchHours(id);
      if (version !== detailVersion.current) return;
      setLoadedBranch(result); setBranchIds([result.branchId]); setAllBranches(false);
      setSchedule(weekDays.map(([day]) => {
        const existing = result.hasSchedule ? result.schedule?.find(item => item.day === day) : undefined;
        return existing ? { ...existing } : { day, isClosed: false, openTime: '', closeTime: '' };
      }));
      form.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) { if (version === detailVersion.current) setError(message(err)); }
    finally { if (version === detailVersion.current) setDetailLoading(false); }
  };
  const save = async (body: SaveBranchHours) => {
    if (pending.current) return;
    pending.current = true; setSaving(true); setError('');
    try { await saveBranchHours(body); }
    catch (err) { setError(message(err)); setConfirm(null); return; }
    finally { pending.current = false; setSaving(false); }
    setConfirm(null); setLoadedBranch(null); show('تم حفظ مواعيد الفروع بنجاح', 'success'); void load();
  };
  const submit = () => {
    if (!canEdit || pending.current) return;
    if (!allBranches && !branchIds.length) { setError('اختر فرعًا واحدًا على الأقل'); return; }
    if (schedule.length !== 7 || new Set(schedule.map(item => item.day)).size !== 7) { setError('يجب إرسال الأيام السبعة دون تكرار'); return; }
    const time = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const item of schedule) {
      if (!item.isClosed && (!time.test(item.openTime ?? '') || !time.test(item.closeTime ?? '') || item.openTime === item.closeTime)) {
        setError(`راجع أوقات ${weekDays.find(([day]) => day === item.day)?.[1]}: أدخل وقتي فتح وإغلاق مختلفين بصيغة HH:mm`); return;
      }
    }
    const days = schedule.map(item => item.isClosed ? { day: item.day, isClosed: true } : { day: item.day, isClosed: false, openTime: item.openTime, closeTime: item.closeTime });
    const body: SaveBranchHours = allBranches ? { allBranches: true, schedule: days } : { allBranches: false, branchIds, schedule: days };
    setError('');
    if (allBranches || branchIds.length > 1) setConfirm(body); else void save(body);
  };
  return <div dir="rtl"><PageHeader title={t('settings.branchHoursTitle')} subtitle={t('settings.branchHoursSubtitle')} actions={<Button variant="secondary" disabled={loading || saving || detailLoading} onClick={() => void load()}><RefreshCw className="h-4 w-4" />{t('settings.refresh')}</Button>} />
    {loadError && <p role="alert" className="text-error mb-4">{loadError}</p>}
    <form ref={form} onSubmit={event => { event.preventDefault(); submit(); }} className="border-b border-outline-variant/40 pb-5 mb-5">
      {loadedBranch && <p className="mb-3 font-semibold">{loadedBranch.branchName} {loadedBranch.hasSchedule ? '' : '— غير محدد'}</p>}
      {(canEdit || loadedBranch) && <fieldset disabled={!canEdit || loading || saving || detailLoading || confirm !== null} className="flex flex-col gap-4">
        {canEdit && <><div className="flex gap-5 text-sm"><label className="flex items-center gap-2"><input type="radio" name="scope" checked={!allBranches} onChange={() => setAllBranches(false)} />فروع محددة</label><label className="flex items-center gap-2"><input type="radio" name="scope" checked={allBranches} onChange={() => setAllBranches(true)} />كل الفروع</label></div>
        {!allBranches && <div className={saving ? 'pointer-events-none' : ''}><MultiSelect label="الفروع" options={rows.map(row => ({ value: row.branchId, label: row.branchName }))} value={branchIds} onChange={setBranchIds} searchable placeholder="اختر الفروع" searchPlaceholder="بحث باسم الفرع" noResultsText="لا توجد فروع" /></div>}</>}
        <div className="overflow-x-auto"><table className="w-full min-w-[430px] text-sm"><thead><tr>{['اليوم', 'مغلق', 'وقت الفتح', 'وقت الإغلاق'].map(label => <th className="p-2 text-start" key={label}>{label}</th>)}</tr></thead><tbody>{schedule.map((item, index) => <tr key={item.day} className="border-t border-outline-variant/30"><td className="p-2">{weekDays[index][1]}</td><td className="p-2"><input role="switch" aria-label={`مغلق يوم ${weekDays[index][1]}`} type="checkbox" checked={item.isClosed} onChange={event => setSchedule(previous => previous.map(day => day.day === item.day ? { ...day, isClosed: event.target.checked } : day))} /></td>{(['openTime', 'closeTime'] as const).map(key => <td className="p-2" key={key}><Input aria-label={`${key === 'openTime' ? 'فتح' : 'إغلاق'} ${weekDays[index][1]}`} type="time" step={60} dir="ltr" disabled={item.isClosed || !canEdit || saving || detailLoading} value={item.isClosed ? '' : item[key] ?? ''} onChange={event => setSchedule(previous => previous.map(day => day.day === item.day ? { ...day, [key]: event.target.value } : day))} /></td>)}</tr>)}</tbody></table></div>
        {canEdit && <div><Button type="submit" loading={saving}>حفظ المواعيد</Button></div>}
      </fieldset>}
      {detailLoading && <p role="status">جاري تحميل جدول الفرع...</p>}
      {error && <p role="alert" className="text-error mt-3">{error}</p>}
    </form>
    {loading ? <p role="status">جاري تحميل الفروع...</p> : <div className="overflow-x-auto"><table className="w-full min-w-[400px] text-sm"><thead><tr>{['الفرع', 'الجدول', 'الحالة الآن', 'إجراءات'].map(label => <th className="p-3 text-start" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.branchId} className="border-t border-outline-variant/40"><td className="p-3">{row.branchName}</td><td className="p-3">{row.hasSchedule ? 'محدد' : 'غير محدد'}</td><td className="p-3">{!row.hasSchedule || row.isOpenNow == null ? 'غير محدد' : row.isOpenNow ? 'مفتوح' : 'مغلق'}</td><td className="p-3"><Button variant="ghost" size="icon" disabled={saving || detailLoading} title={canEdit ? 'تعديل المواعيد' : 'عرض المواعيد'} aria-label={`${canEdit ? 'تعديل' : 'عرض'} مواعيد ${row.branchName}`} onClick={() => void view(row.branchId)}>{canEdit ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></td></tr>)}</tbody></table>{!rows.length && !loadError && <p className="py-6 text-center">لا توجد فروع</p>}</div>}
    <ConfirmDialog open={confirm !== null} loading={saving} onClose={() => { if (!pending.current) setConfirm(null); }} onConfirm={() => { if (confirm) void save(confirm); }} title="استبدال مواعيد الفروع" message={confirm?.allBranches ? 'سيتم استبدال الجدول الأسبوعي لكل الفروع. هل تريد المتابعة؟' : `سيتم استبدال الجدول الأسبوعي للفروع المحددة (${branchIds.length}). هل تريد المتابعة؟`} confirmText="تطبيق المواعيد" />
  </div>;
}
