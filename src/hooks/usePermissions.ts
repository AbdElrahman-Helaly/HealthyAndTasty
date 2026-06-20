import { getPermissions } from '@/services/permission.service';
import { useAsync } from './useAsync';

export function usePermissions() {
  return useAsync(getPermissions, []);
}
