import { http } from '@/lib/apiClient';
import type {
  NotificationAudiencePreview,
  NotificationAudienceRequest,
  NotificationListItem,
  NotificationSendResult,
  PagedResult,
  SendNotificationRequest,
} from '@/types';

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

function buildAudienceFormData(body: NotificationAudienceRequest): FormData {
  const formData = new FormData();
  formData.append('AudienceType', body.audienceType);
  formData.append('IncludeGuests', String(body.includeGuests));
  body.userIds?.forEach((id) => formData.append('UserIds', String(id)));
  if (body.activeWithinDays !== undefined) formData.append('ActiveWithinDays', String(body.activeWithinDays));
  if (body.inactiveForDays !== undefined) formData.append('InactiveForDays', String(body.inactiveForDays));
  if (body.registeredWithinDays !== undefined) formData.append('RegisteredWithinDays', String(body.registeredWithinDays));
  if (body.abandonedCartForHours !== undefined) formData.append('AbandonedCartForHours', String(body.abandonedCartForHours));
  if (body.government) formData.append('Government', body.government);
  if (body.city) formData.append('City', body.city);
  if (body.categoryId !== undefined) formData.append('CategoryId', String(body.categoryId));
  if (body.minOrdersCount !== undefined) formData.append('MinOrdersCount', String(body.minOrdersCount));
  if (body.lastOrderFrom) formData.append('LastOrderFrom', body.lastOrderFrom);
  if (body.lastOrderTo) formData.append('LastOrderTo', body.lastOrderTo);
  return formData;
}

/** POST /api/admin/notifications/audience/preview */
export function previewNotificationAudience(body: NotificationAudienceRequest): Promise<NotificationAudiencePreview> {
  return http.post<NotificationAudiencePreview>(
    '/api/admin/notifications/audience/preview',
    buildAudienceFormData(body),
  );
}

/** POST /api/admin/notifications/send */
export function sendNotification(body: SendNotificationRequest): Promise<NotificationSendResult> {
  const formData = buildAudienceFormData(body);
  formData.append('Title', body.title);
  formData.append('Body', body.body);

  if (body.targetUrl) formData.append('TargetUrl', body.targetUrl);
  if (body.image) formData.append('Image', body.image);

  return http.post<NotificationSendResult>('/api/admin/notifications/send', formData);
}

/** DELETE /api/admin/notifications/{id} */
export function deleteNotification(id: string): Promise<unknown> {
  return http.delete<unknown>(`/api/admin/notifications/${encodeURIComponent(id)}`);
}
