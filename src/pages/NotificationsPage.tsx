import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Plus, Send, Trash2, Upload } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { FormDrawer } from '@/components/shared/FormDrawer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/Modal';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { deleteNotification, listNotifications, previewNotificationAudience, sendNotification } from '@/api/notifications.api';
import { listAdminCategories } from '@/api/categories.api';
import { listUsers } from '@/api/users.api';
import { PERMISSIONS } from '@/types/permissions';
import type { AdminCategory, NotificationAudiencePreview, NotificationAudienceRequest, NotificationAudienceType, NotificationListItem, UserManagement } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/lib/apiClient';

const PAGE_SIZE = 12;
const audienceLabels: Record<string, string> = { all_users: 'جميع المستخدمين', specific_users: 'مستخدم واحد أو أكثر', active_users: 'المستخدمون النشطون', inactive_users: 'المستخدمون غير النشطين', new_users: 'المستخدمون المسجلون حديثاً', users_with_orders: 'المستخدمون الذين طلبوا سابقاً', users_without_orders: 'المستخدمون الذين لم يطلبوا', abandoned_cart_users: 'المستخدمون الذين تركوا منتجات في السلة', customers_by_location: 'العملاء حسب المنطقة', customers_by_category: 'العملاء المهتمون بتصنيف', frequent_customers: 'العملاء الأكثر طلباً', customers_by_last_order: 'العملاء حسب آخر طلب', all: 'الجميع', role: 'حسب الدور', branch: 'حسب الفرع', user: 'مستخدم محدد' };
const audienceOptions: Array<{ value: NotificationAudienceType; label: string }> = [
  { value: 'all_users', label: 'All Users / جميع المستخدمين' }, { value: 'specific_users', label: 'Specific Users / مستخدم واحد أو أكثر' }, { value: 'active_users', label: 'Active Users / المستخدمون النشطون' }, { value: 'inactive_users', label: 'Inactive Users / المستخدمون غير النشطين' }, { value: 'new_users', label: 'New Users / المستخدمون المسجلون حديثاً' }, { value: 'users_with_orders', label: 'Users With Orders / المستخدمون الذين طلبوا سابقاً' }, { value: 'users_without_orders', label: 'Users Without Orders / المستخدمون الذين لم يطلبوا' }, { value: 'abandoned_cart_users', label: 'Abandoned Cart Users / المستخدمون الذين تركوا منتجات في السلة' }, { value: 'customers_by_location', label: 'Customers By Location / العملاء حسب المنطقة' }, { value: 'customers_by_category', label: 'Customers By Category / العملاء المهتمون بتصنيف' }, { value: 'frequent_customers', label: 'Frequent Customers / العملاء الأكثر طلباً' }, { value: 'customers_by_last_order', label: 'Customers By Last Order / العملاء حسب آخر طلب' },
];

function timeAgo(value: string) { const mins = Math.floor((Date.now() - new Date(value).getTime()) / 60000); return mins < 1 ? 'الآن' : mins < 60 ? `منذ ${mins} دقيقة` : mins < 1440 ? `منذ ${Math.floor(mins / 60)} ساعة` : `منذ ${Math.floor(mins / 1440)} يوم`; }
function errorsFrom(error: unknown): string[] { return error instanceof ApiError ? (error.errors.length ? error.errors : [error.message]) : [error instanceof Error ? error.message : 'فشل تنفيذ الطلب']; }

export function NotificationsPage() {
  const { t } = useTranslation(); const { show } = useToast();
  const [rows, setRows] = useState<NotificationListItem[]>([]); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false); const [sending, setSending] = useState(false); const [previewing, setPreviewing] = useState(false); const [deleting, setDeleting] = useState(false); const [deleteTarget, setDeleteTarget] = useState<NotificationListItem | null>(null);
  const [users, setUsers] = useState<UserManagement[]>([]); const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [targetUrl, setTargetUrl] = useState(''); const [image, setImage] = useState<File | null>(null);
  const [audienceType, setAudienceType] = useState<NotificationAudienceType>('all_users'); const [includeGuests, setIncludeGuests] = useState(false); const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [activeWithinDays, setActiveWithinDays] = useState(''); const [inactiveForDays, setInactiveForDays] = useState(''); const [registeredWithinDays, setRegisteredWithinDays] = useState(''); const [abandonedCartForHours, setAbandonedCartForHours] = useState('');
  const [government, setGovernment] = useState(''); const [city, setCity] = useState(''); const [categoryId, setCategoryId] = useState(''); const [minOrdersCount, setMinOrdersCount] = useState(''); const [lastOrderFrom, setLastOrderFrom] = useState(''); const [lastOrderTo, setLastOrderTo] = useState('');
  const [preview, setPreview] = useState<NotificationAudiencePreview | null>(null); const [formErrors, setFormErrors] = useState<string[]>([]);
  usePageTitle(t('notifications.title'));

  const load = useCallback(async (nextPage: number) => { setError(''); try { const result = await listNotifications({ page: nextPage, pageSize: PAGE_SIZE }); setRows(result.items); setTotalPages(Math.max(1, result.totalPages)); setPage(nextPage); } catch (err) { setError(err instanceof Error ? err.message : 'فشل تحميل الإشعارات'); } }, []);
  useEffect(() => { void load(1); }, [load]);
  useEffect(() => { let cancelled = false; const loadUsers = async () => { const all = new Map<number, UserManagement>(); for (let current = 1; current <= 100; current += 1) { const result = await listUsers({ page: current, pageSize: 100 }); result.items.forEach(user => all.set(user.id, user)); if (current >= result.totalPages || !result.items.length) break; } if (!cancelled) setUsers([...all.values()]); }; void loadUsers().catch(() => { if (!cancelled) setUsers([]); }); void listAdminCategories().then(result => { if (!cancelled) setCategories(result); }).catch(() => { if (!cancelled) setCategories([]); }); return () => { cancelled = true; }; }, []);
  useEffect(() => { setPreview(null); }, [audienceType, includeGuests, selectedUserIds, activeWithinDays, inactiveForDays, registeredWithinDays, abandonedCartForHours, government, city, categoryId, minOrdersCount, lastOrderFrom, lastOrderTo]);
  const userOptions = useMemo(() => users.map(user => ({ value: String(user.id), label: `${user.name} - ${user.phone || user.email}` })), [users]);
  const locked = sending || previewing;

  function resetForm() { setTitle(''); setBody(''); setTargetUrl(''); setImage(null); setAudienceType('all_users'); setIncludeGuests(false); setSelectedUserIds([]); setActiveWithinDays(''); setInactiveForDays(''); setRegisteredWithinDays(''); setAbandonedCartForHours(''); setGovernment(''); setCity(''); setCategoryId(''); setMinOrdersCount(''); setLastOrderFrom(''); setLastOrderTo(''); setPreview(null); setFormErrors([]); }
  function openDrawer() { resetForm(); setDrawerOpen(true); }
  function audienceRequest(): NotificationAudienceRequest | null {
    const issues: string[] = []; const positive = (value: string, label: string) => { const number = Number(value); if (!Number.isInteger(number) || number <= 0) issues.push(`${label} يجب أن يكون عددًا صحيحًا أكبر من صفر.`); return number; }; const request: NotificationAudienceRequest = { audienceType, includeGuests };
    if (audienceType === 'specific_users') { if (!selectedUserIds.length) issues.push('اختر مستخدمًا واحدًا على الأقل.'); request.userIds = selectedUserIds.map(Number); }
    if (audienceType === 'active_users') request.activeWithinDays = positive(activeWithinDays, 'فترة النشاط');
    if (audienceType === 'inactive_users') request.inactiveForDays = positive(inactiveForDays, 'فترة عدم النشاط');
    if (audienceType === 'new_users') request.registeredWithinDays = positive(registeredWithinDays, 'فترة التسجيل');
    if (audienceType === 'abandoned_cart_users') request.abandonedCartForHours = positive(abandonedCartForHours, 'فترة السلة المتروكة');
    if (audienceType === 'customers_by_location') { if (!government.trim() && !city.trim()) issues.push('أدخل المحافظة أو المدينة على الأقل.'); if (government.trim()) request.government = government.trim(); if (city.trim()) request.city = city.trim(); }
    if (audienceType === 'customers_by_category') { if (!categoryId) issues.push('اختر التصنيف.'); else request.categoryId = Number(categoryId); }
    if (audienceType === 'frequent_customers') request.minOrdersCount = positive(minOrdersCount, 'الحد الأدنى للطلبات');
    if (audienceType === 'customers_by_last_order') { if (!lastOrderFrom && !lastOrderTo) issues.push('اختر تاريخًا واحدًا على الأقل لآخر طلب.'); if (lastOrderFrom && lastOrderTo && lastOrderFrom > lastOrderTo) issues.push('تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية.'); if (lastOrderFrom) request.lastOrderFrom = lastOrderFrom; if (lastOrderTo) request.lastOrderTo = lastOrderTo; }
    if (issues.length) { setFormErrors(issues); return null; } return request;
  }
  async function handlePreview() { const request = audienceRequest(); if (!request) return; setFormErrors([]); setPreviewing(true); try { setPreview(await previewNotificationAudience(request)); } catch (err) { setFormErrors(errorsFrom(err)); } finally { setPreviewing(false); } }
  async function handleSend() { if (!title.trim() || !body.trim()) { setFormErrors([!title.trim() ? 'العنوان مطلوب.' : 'المحتوى مطلوب.']); return; } const audience = audienceRequest(); if (!audience || !preview) return; setFormErrors([]); setSending(true); try { const result = await sendNotification({ ...audience, title: title.trim(), body: body.trim(), image, targetUrl: targetUrl.trim() || undefined }); setDrawerOpen(false); show(`Notification sent to ${result.recipientCount} recipients.`, 'success'); void load(1); } catch (err) { setFormErrors(errorsFrom(err)); } finally { setSending(false); } }
  async function onDelete() { if (!deleteTarget) return; setDeleting(true); try { await deleteNotification(deleteTarget.id); show('تم حذف الإشعار', 'success'); setDeleteTarget(null); void load(page); } catch (err) { show(err instanceof Error ? err.message : 'فشل حذف الإشعار', 'error'); setDeleteTarget(null); } finally { setDeleting(false); } }

  const fields = () => {
    if (audienceType === 'specific_users') return <MultiSelect label="المستخدمون" options={userOptions} value={selectedUserIds} onChange={setSelectedUserIds} searchable placeholder="اختر المستخدمين" searchPlaceholder="ابحث بالاسم أو رقم الهاتف" noResultsText="لا يوجد مستخدمون" />;
    if (audienceType === 'active_users') return <Input label="نشط خلال آخر (يوم)" type="number" min={1} value={activeWithinDays} disabled={locked} onChange={event => setActiveWithinDays(event.target.value)} />;
    if (audienceType === 'inactive_users') return <Input label="غير نشط منذ (يوم)" type="number" min={1} value={inactiveForDays} disabled={locked} onChange={event => setInactiveForDays(event.target.value)} />;
    if (audienceType === 'new_users') return <Input label="مسجل خلال آخر (يوم)" type="number" min={1} value={registeredWithinDays} disabled={locked} onChange={event => setRegisteredWithinDays(event.target.value)} />;
    if (audienceType === 'abandoned_cart_users') return <Input label="سلة متروكة منذ (ساعة)" type="number" min={1} value={abandonedCartForHours} disabled={locked} onChange={event => setAbandonedCartForHours(event.target.value)} />;
    if (audienceType === 'customers_by_location') return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Input label="المحافظة (اختياري)" value={government} disabled={locked} onChange={event => setGovernment(event.target.value)} /><Input label="المدينة (اختياري)" value={city} disabled={locked} onChange={event => setCity(event.target.value)} /></div>;
    if (audienceType === 'customers_by_category') return <Select label="التصنيف" value={categoryId} disabled={locked} onChange={event => setCategoryId(event.target.value)}><option value="">اختر التصنيف</option>{categories.map(category => <option key={category.id} value={String(category.id)}>{category.name}</option>)}</Select>;
    if (audienceType === 'frequent_customers') return <Input label="الحد الأدنى لعدد الطلبات" type="number" min={1} value={minOrdersCount} disabled={locked} onChange={event => setMinOrdersCount(event.target.value)} />;
    if (audienceType === 'customers_by_last_order') return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Input label="آخر طلب من (اختياري)" type="date" value={lastOrderFrom} disabled={locked} onChange={event => setLastOrderFrom(event.target.value)} /><Input label="آخر طلب إلى (اختياري)" type="date" value={lastOrderTo} disabled={locked} onChange={event => setLastOrderTo(event.target.value)} /></div>;
    return null;
  };
  const columns: Column<NotificationListItem>[] = [
    { key: 'title', header: 'العنوان', render: item => <span className="font-semibold text-on-surface">{item.title}</span> }, { key: 'body', header: 'المحتوى', render: item => <span className="line-clamp-1 text-on-surface-variant">{item.body}</span> }, { key: 'audience', header: 'الجمهور', render: item => <span className="rounded-full bg-primary-surface px-2.5 py-1 text-xs font-semibold text-primary">{audienceLabels[item.audienceType ?? item.target] ?? item.audienceType ?? item.target}</span> }, { key: 'recipients', header: 'المستلمون', render: item => <span>{item.recipientCount ?? '—'}</span> }, { key: 'delivered', header: 'تم التسليم', render: item => <span>{item.deliveredCount ?? '—'}</span> }, { key: 'failed', header: 'فشل', render: item => <span>{item.failedCount ?? '—'}</span> }, { key: 'status', header: 'الحالة', render: item => <span className={item.isActive ? 'badge badge-success' : 'badge badge-danger'}>{item.isActive ? 'نشط' : 'موقوف'}</span> }, { key: 'createdAt', header: 'التاريخ', render: item => <span className="text-xs text-on-surface-variant/60">{timeAgo(item.createdAt)}</span> }, { key: 'actions', header: 'إجراءات', render: item => <Button variant="ghost" size="icon" className="text-error hover:bg-error/10" title="حذف" onClick={() => setDeleteTarget(item)}><Trash2 className="h-4 w-4" /></Button> },
  ];

  return <div>
    <PageHeader title={t('notifications.title')} subtitle={t('notifications.subtitle')} actions={<PermissionGate permission={PERMISSIONS.NotificationsSend}><Button size="sm" className="gap-1.5" onClick={openDrawer}><Plus className="h-4 w-4" />إرسال إشعار</Button></PermissionGate>} />
    <Card padding="none">{error ? <div className="flex flex-col items-center justify-center py-16 text-center"><p className="text-sm font-medium text-on-surface-variant">{error}</p><Button variant="secondary" size="sm" className="mt-4" onClick={() => void load(page)}>إعادة المحاولة</Button></div> : <><DataTable columns={columns} data={rows} keyExtractor={item => item.id} emptyMessage="لا توجد إشعارات" /><div className="px-4 pb-4"><Pagination currentPage={page} totalPages={totalPages} onPageChange={nextPage => void load(nextPage)} /></div></>}</Card>
    <FormDrawer open={drawerOpen} onClose={() => { if (!locked) setDrawerOpen(false); }} title="إرسال إشعار" footer={<div className="flex items-center justify-end gap-3"><Button variant="secondary" disabled={locked} onClick={() => setDrawerOpen(false)}>إلغاء</Button><Button variant="secondary" size="icon" title="Preview recipients" aria-label="Preview recipients" loading={previewing} disabled={sending} onClick={() => void handlePreview()}>{!previewing && <Eye className="h-4 w-4" />}</Button><Button loading={sending} disabled={!preview || previewing} onClick={() => void handleSend()} className="gap-1.5"><Send className="h-4 w-4" />إرسال</Button></div>}>
      <div dir="rtl" className="flex flex-col gap-4"><Input label="العنوان" value={title} disabled={locked} onChange={event => setTitle(event.target.value)} /><Textarea label="المحتوى" value={body} disabled={locked} onChange={event => setBody(event.target.value)} /><Select label="نوع الجمهور" value={audienceType} disabled={locked} onChange={event => setAudienceType(event.target.value as NotificationAudienceType)}>{audienceOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</Select><label className="flex items-center gap-2 text-sm text-on-surface"><input type="checkbox" checked={includeGuests} disabled={locked} onChange={event => setIncludeGuests(event.target.checked)} /> تضمين الضيوف</label><fieldset disabled={locked} className={locked ? 'pointer-events-none opacity-60' : ''}>{fields()}</fieldset><Input label="رابط الوجهة (اختياري)" placeholder="offers, orders, home" dir="ltr" value={targetUrl} disabled={locked} onChange={event => setTargetUrl(event.target.value)} /><div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-on-surface">صورة (اختيارية)</label><label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface px-3 text-sm text-on-surface-variant hover:border-primary"><Upload className="h-4 w-4" /><span className="truncate">{image?.name ?? 'اختر صورة'}</span><input className="sr-only" type="file" accept="image/*" disabled={locked} onChange={event => setImage(event.target.files?.[0] ?? null)} /></label></div>{preview && <div className="rounded-xl border border-primary/20 bg-primary-surface p-3 text-sm"><p className="font-semibold text-primary">عدد المستلمين: {preview.totalRecipients}</p><p>المستخدمون المسجلون: {preview.registeredUsers} | الضيوف: {preview.guests}</p>{preview.sample.length > 0 && <div className="mt-2 border-t border-primary/20 pt-2"><p className="font-medium">عينة المستلمين</p>{preview.sample.map((recipient, index) => <p key={`${recipient.userId ?? recipient.guestId ?? index}-${index}`} className="text-on-surface-variant">{recipient.name ?? 'ضيف'} {recipient.phone ? `- ${recipient.phone}` : ''}</p>)}</div>}</div>}{formErrors.length > 0 && <div role="alert" className="rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{formErrors.map((message, index) => <p key={`${message}-${index}`}>{message}</p>)}</div>}</div>
    </FormDrawer>
    <ConfirmDialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} onConfirm={() => void onDelete()} loading={deleting} title="حذف الإشعار" message={`هل أنت متأكد من حذف الإشعار "${deleteTarget?.title}"؟`} />
  </div>;
}
