import { getDashboardKpis } from '@/services/dashboard.service';
import { useAsync } from './useAsync';

export function useDashboardKpis() {
  return useAsync(getDashboardKpis, []);
}
