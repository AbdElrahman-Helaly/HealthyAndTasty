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
  const formData = new FormData();
  formData.append('Title', body.title);
  formData.append('Body', body.body);
  formData.append('Target', body.target);

  if (body.targetUrl) formData.append('TargetUrl', body.targetUrl);
  if (body.image) formData.append('Image', body.image);
  if (body.target === 'user' && body.userId !== undefined) formData.append('UserId', String(body.userId));
  if (body.target === 'role' && body.role) formData.append('Role', body.role);
  if (body.target === 'branch' && body.branchId) formData.append('BranchId', body.branchId);

  return http.post<NotificationListItem>('/api/admin/notifications/send', formData);
}

/** DELETE /api/admin/notifications/{id} */
export function deleteNotification(id: string): Promise<unknown> {
  return http.delete<unknown>(`/api/admin/notifications/${encodeURIComponent(id)}`);
}
