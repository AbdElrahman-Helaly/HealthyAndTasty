import { mockAuditLogs } from '@/data/mockAuditLogs';
import type { AuditLog } from '@/types';

export async function getAuditLogs(): Promise<AuditLog[]> {
  // Future: return api.audit.list();
  return mockAuditLogs;
}
