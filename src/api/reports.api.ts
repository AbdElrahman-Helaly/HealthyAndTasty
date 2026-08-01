import { http } from '@/lib/apiClient';
import type { AuditLog, AuditLogListParams, PagedResult, SalesReport } from '@/types';

/** GET /api/admin/reports/sales */
export function getSalesReport(from?: string, to?: string): Promise<SalesReport> {
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const query = qs.toString();
  return http.get<SalesReport>(`/api/admin/reports/sales${query ? `?${query}` : ''}`);
}

/** GET /api/admin/reports/audit-logs — Admin only */
export function getAuditLogs(params: AuditLogListParams = {}): Promise<PagedResult<AuditLog>> {
  const qs = new URLSearchParams();
  if (params.entity) qs.set('entity', params.entity);
  if (params.action) qs.set('action', params.action);
  if (params.userId !== undefined) qs.set('userId', String(params.userId));
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
  const query = qs.toString();
  return http.get<PagedResult<AuditLog>>(`/api/admin/reports/audit-logs${query ? `?${query}` : ''}`);
}
