import { mockKpis } from '@/data/mockKpis';
import type { DashboardKpis } from '@/types';
import { delay } from '@/lib/utils';

export async function getDashboardKpis(): Promise<DashboardKpis> {
  // Future: return api.dashboard.getKpis();
  await delay(300);
  return mockKpis;
}
