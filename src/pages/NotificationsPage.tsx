import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Send } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { FormDrawer } from '@/components/shared/FormDrawer';
import { CountrySelector } from '@/components/shared/CountrySelector';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { useNotifications, useSendNotification, useMarkAsRead } from '@/hooks/useNotifications';
import { useBranches } from '@/hooks/useBranchDetails';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatDate } from '@/lib/utils';
import type { Notification, SendNotificationInput } from '@/types';

const schema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  targetType: z.enum(['all', 'country', 'branch']),
  targetId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function NotificationsPage() {
  const { t } = useTranslation();
  const { data: notifications, isLoading, refetch } = useNotifications();
  const { data: branches } = useBranches();
  const { mutate: send, isLoading: sending } = useSendNotification();
  const { mutate: markRead } = useMarkAsRead();
  const [drawerOpen, setDrawerOpen] = useState(false);
  usePageTitle(t('notifications.title'));

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', message: '', targetType: 'all', targetId: '' },
  });

  const targetType = watch('targetType'); // eslint-disable-line react-hooks/incompatible-library

  async function onSubmit(data: FormData) {
    const input: SendNotificationInput = {
      title: data.title,
      message: data.message,
      targetType: data.targetType,
      targetId: data.targetType === 'all' ? undefined : data.targetId,
    };
    await send(input);
    setDrawerOpen(false);
    reset();
    refetch();
  }

  async function handleMarkRead(id: string) {
    await markRead(id);
    refetch();
  }

  const columns = [
    { key: 'title', header: t('notifications.notificationTitle'), render: (row: Notification) => (
      <span className={row.isRead ? 'text-on-surface-variant' : 'font-semibold text-on-surface'}>{row.title}</span>
    )},
    { key: 'message', header: t('notifications.message'), render: (row: Notification) => (
      <span className="line-clamp-1 text-on-surface-variant">{row.message}</span>
    )},
    { key: 'target', header: 'Target', render: (row: Notification) => row.targetLabel ?? row.targetType },
    { key: 'status', header: t('common.status'), render: (row: Notification) => (
      <Badge variant={row.isRead ? 'default' : 'accent'}>{row.isRead ? t('notifications.read') : t('notifications.unread')}</Badge>
    )},
    { key: 'date', header: 'Date', render: (row: Notification) => formatDate(row.createdAt) },
    { key: 'actions', header: t('common.actions'), render: (row: Notification) => (
      !row.isRead ? (
        <Button variant="ghost" size="sm" onClick={() => handleMarkRead(row.id)}>{t('common.markRead')}</Button>
      ) : null
    )},
  ];

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
        actions={
          <Button onClick={() => setDrawerOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t('notifications.send')}
          </Button>
        }
      />
      <Card padding="none">
        <DataTable columns={columns} data={notifications ?? []} keyExtractor={(r) => r.id} />
      </Card>

      <FormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t('notifications.send')}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</Button>
            <Button loading={sending} onClick={handleSubmit(onSubmit)} className="gap-1.5">
              <Send className="h-4 w-4" />
              {t('common.send')}
            </Button>
          </div>
        }
      >
        <form className="flex flex-col gap-4">
          <Input label={t('notifications.notificationTitle')} error={errors.title?.message} {...register('title')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">{t('notifications.message')}</label>
            <textarea
              className="min-h-[100px] rounded-lg border border-outline-variant px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              {...register('message')}
            />
            {errors.message && <p className="text-xs text-error">{errors.message.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Target</label>
            <select className="h-11 rounded-lg border border-outline-variant px-3 text-sm" {...register('targetType')}>
              <option value="all">{t('notifications.targetAll')}</option>
              <option value="country">{t('notifications.targetCountry')}</option>
              <option value="branch">{t('notifications.targetBranch')}</option>
            </select>
          </div>
          {targetType === 'country' && (
            <CountrySelector value={watch('targetId') ?? ''} onChange={(v) => setValue('targetId', v)} label="Country" />
          )}
          {targetType === 'branch' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Branch</label>
              <select className="h-11 rounded-lg border border-outline-variant px-3 text-sm" {...register('targetId')}>
                <option value="">Select branch</option>
                {(branches ?? []).map((b, i) => (
                  <option key={b.id || `branch-${i}`} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </form>
      </FormDrawer>
    </div>
  );
}
