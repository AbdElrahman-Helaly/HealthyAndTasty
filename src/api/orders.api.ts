import { http } from '@/lib/apiClient';
import type {
  DashboardOrderDetail,
  DashboardOrderListItem,
  LiveOrdersBoard,
  OrderListParams,
  PagedResult,
  UpdateOrderStatusRequest,
} from '@/types';

/** GET /api/admin/orders */
export function replyToOrderRating(id: number | string, reply: string): Promise<DashboardOrderDetail> {
  return http.put(`/api/admin/orders/${encodeURIComponent(String(id))}/rating/reply`, { reply });
}

/** GET /api/admin/orders */
export function listOrders(params: OrderListParams = {}): Promise<PagedResult<DashboardOrderListItem>> {
  const qs = new URLSearchParams();
  if (params.status !== undefined) qs.set('status', String(params.status));
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.search) qs.set('search', params.search);
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
  const query = qs.toString();
  return http.get<PagedResult<DashboardOrderListItem>>(`/api/admin/orders${query ? `?${query}` : ''}`);
}

/** GET /api/admin/orders/{id} */
export function getOrderDetail(id: number | string): Promise<DashboardOrderDetail> {
  return http.get<DashboardOrderDetail>(`/api/admin/orders/${encodeURIComponent(String(id))}`);
}

/** PUT /api/admin/orders/{id}/status */
export function updateOrderStatus(
  id: number | string,
  body: UpdateOrderStatusRequest,
): Promise<DashboardOrderDetail> {
  return http.put<DashboardOrderDetail>(
    `/api/admin/orders/${encodeURIComponent(String(id))}/status`,
    body,
  );
}

/** GET /api/admin/live-orders */
export function getLiveOrders(): Promise<LiveOrdersBoard> {
  return http.get<LiveOrdersBoard>('/api/admin/live-orders');
}
