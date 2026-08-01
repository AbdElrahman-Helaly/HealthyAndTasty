import { http } from '@/lib/apiClient';
import type { NotificationListItem, PagedResult, SendNotificationRequest } from '@/types';

export interface NotificationListParams {
  page?: number;
  pageSize?: number;
}

/** GET /api/admin/notifications */
export function listNotifications(
  params: NotificationListParams = {},
): Promise<PagedResult<NotificationListItem>> {
  const qs = new URLSearchParams();
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
  const query = qs.toString();
  return http.get<PagedResult<NotificationListItem>>(
    `/api/admin/notifications${query ? `?${query}` : ''}`,
  );
}

/** POST /api/admin/notifications/send */
export function sendNotification(
  body: SendNotificationRequest,
): Promise<NotificationListItem> {
  return http.post<NotificationListItem>('/api/admin/notifications/send', body);
}

/** DELETE /api/admin/notifications/{id} */
export function deleteNotification(id: string): Promise<unknown> {
  return http.delete<unknown>(`/api/admin/notifications/${encodeURIComponent(id)}`);
}
