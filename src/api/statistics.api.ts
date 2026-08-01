import { http } from '@/lib/apiClient';
import type { DashboardStatistics } from '@/types';

/** GET /api/admin/statistics */
export function getStatistics(from?: string, to?: string): Promise<DashboardStatistics> {
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const query = qs.toString();
  return http.get<DashboardStatistics>(`/api/admin/statistics${query ? `?${query}` : ''}`);
}
