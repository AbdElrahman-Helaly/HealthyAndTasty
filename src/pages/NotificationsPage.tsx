import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Send, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { FormDrawer } from '@/components/shared/FormDrawer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/Modal';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { listNotifications, sendNotification, deleteNotification } from '@/api/notifications.api';
import { listRoles } from '@/api/roles.api';
import { listBranches } from '@/api/branches.api';
import { listUsers } from '@/api/users.api';
import { PERMISSIONS } from '@/types/permissions';
import type { NotificationListItem, RoleDto, BranchAdmin, UserManagement } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/hooks/useToast';

const PAGE_SIZE = 12;

const schema = z.object({
  title: z.string().min(1, 'العنوان مطلوب'),
  body: z.string().min(1, 'المحتوى مطلوب'),
  target: z.enum(['all', 'role', 'branch', 'user']),
  imageUrl: z.string().optional().or(z.literal('')),
  targetUrl: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} يوم`;
}

const targetLabels: Record<string, string> = {
  all: 'الجميع',
  role: 'حسب الدور',
  branch: 'حسب الفرع',
  user: 'مستخدم محدد',
};

export function NotificationsPage() {
  const { t } = useTranslation();
  const { show: showToast } = useToast();
  const [rows, setRows] = useState<NotificationListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NotificationListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [branches, setBranches] = useState<BranchAdmin[]>([]);
  const [users, setUsers] = useState<UserManagement[]>([]);

  const [roleName, setRoleName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [userId, setUserId] = useState('');

  usePageTitle(t('notifications.title'));

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', body: '', target: 'all', imageUrl: '', targetUrl: '' },
  });

  const target = watch('target');

  const load = useCallback(async (p: number) => {
    setError('');
    try {
      const res = await listNotifications({ page: p, pageSize: PAGE_SIZE });
      setRows(res.items);
      setTotalPages(Math.max(1, res.totalPages));
      setPage(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الإشعارات');
    }
  }, []);

  useEffect(() => {
    void load(1);
  }, [load]);

  useEffect(() => {
    void Promise.all([
      listRoles().catch(() => [] as RoleDto[]),
      listBranches().catch(() => [] as BranchAdmin[]),
      listUsers({ page: 1, pageSize: 100 }).catch(() => null),
    ]).then(([r, b, u]) => {
      setRoles(r);
      setBranches(b);
      if (u) setUsers(u.items);
    });
  }, []);

  function openDrawer() {
    reset();
    setRoleName('');
    setBranchId('');
    setUserId('');
    setDrawerOpen(true);
  }

  async function onSubmit(data: FormData) {
    setSending(true);
    try {
      await sendNotification({
        title: data.title,
        body: data.body,
        imageUrl: data.imageUrl || null,
        targetUrl: data.targetUrl || null,
        target: data.target,
        role: data.target === 'role' ? roleName || null : null,
        branchId: data.target === 'branch' ? branchId || null : null,
        userId: data.target === 'user' ? Number(userId) || null : null,
      });
      setDrawerOpen(false);
      showToast('تم إرسال الإشعار بنجاح', 'success');
      void load(1);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشل إرسال الإشعار', 'error');
    } finally {
      setSending(false);
    }
  }

  async function onDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteNotification(deleteTarget.id);
      showToast('تم حذف الإشعار', 'success');
      setDeleteTarget(null);
      void load(page);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشل حذف الإشعار', 'error');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<NotificationListItem>[] = [
    {
      key: 'title',
      header: 'العنوان',
      render: (n) => <span className="font-semibold text-on-surface">{n.title}</span>,
    },
    {
      key: 'body',
      header: 'المحتوى',
      render: (n) => <span className="line-clamp-1 text-on-surface-variant">{n.body}</span>,
    },
    {
      key: 'target',
      header: 'الجمهور',
      render: (n) => (
        <span className="rounded-full bg-primary-surface px-2.5 py-1 text-xs font-semibold text-primary">
          {targetLabels[n.target] ?? n.target}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (n) => (
        <span className={n.isActive ? 'badge badge-success' : 'badge badge-danger'}>
          {n.isActive ? 'نشط' : 'موقوف'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'التاريخ',
      render: (n) => <span className="text-xs text-on-surface-variant/60">{timeAgo(n.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'إجراءات',
      render: (n) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="text-error hover:bg-error/10"
            title="حذف"
            onClick={() => setDeleteTarget(n)}
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
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
        actions={
          <PermissionGate permission={PERMISSIONS.NotificationsSend}>
            <Button size="sm" className="gap-1.5" onClick={openDrawer}>
              <Plus className="h-4 w-4" />
              إرسال إشعار
            </Button>
          </PermissionGate>
        }
      />

      <Card padding="none">
        {error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-on-surface-variant">{error}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => void load(page)}>
              إعادة المحاولة
            </Button>
          </div>
        )}
        {!error && (
          <>
            <DataTable
              columns={columns}
              data={rows}
              keyExtractor={(n) => n.id}
              emptyMessage="لا توجد إشعارات"
            />
            <div className="px-4 pb-4">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => void load(p)} />
            </div>
          </>
        )}
      </Card>

      <FormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="إرسال إشعار"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>إلغاء</Button>
            <Button loading={sending} onClick={() => void handleSubmit(onSubmit)()} className="gap-1.5">
              <Send className="h-4 w-4" />
              إرسال
            </Button>
          </div>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="العنوان" error={errors.title?.message} {...register('title')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface">المحتوى</label>
            <textarea
              className="min-h-[100px] rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              {...register('body')}
            />
            {errors.body && <p className="text-xs text-error">{errors.body.message}</p>}
          </div>
          <Select label="الجمهور" {...register('target')}>
            <option value="all">الجميع</option>
            <option value="role">حسب الدور</option>
            <option value="branch">حسب الفرع</option>
            <option value="user">مستخدم محدد</option>
          </Select>

          {target === 'role' && (
            <Select label="الدور" value={roleName} onChange={(e) => setRoleName(e.target.value)}>
              <option value="" disabled>اختر الدور</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>{r.displayName}</option>
              ))}
            </Select>
          )}
          {target === 'branch' && (
            <Select label="الفرع" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="" disabled>اختر الفرع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          )}
          {target === 'user' && (
            <Select label="المستخدم" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="" disabled>اختر المستخدم</option>
              {users.map((u) => (
                <option key={u.id} value={String(u.id)}>{u.name} — {u.role}</option>
              ))}
            </Select>
          )}

          <Input label="رابط الصورة (اختياري)" placeholder="https://..." dir="ltr" {...register('imageUrl')} />
          <Input label="رابط الوجهة (اختياري)" placeholder="/orders/123" dir="ltr" {...register('targetUrl')} />
        </form>
      </FormDrawer>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void onDelete()}
        loading={deleting}
        title="حذف الإشعار"
        message={`هل أنت متأكد من حذف الإشعار "${deleteTarget?.title}"؟`}
      />
    </div>
  );
}
