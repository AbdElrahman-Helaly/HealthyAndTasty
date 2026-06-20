import { getAuditLogs } from '@/services/audit.service';
import { useAsync } from './useAsync';

export function useAuditLogs() {
  return useAsync(getAuditLogs, []);
}
