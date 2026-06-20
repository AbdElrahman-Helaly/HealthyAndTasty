import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permissions } from '@/types';

interface PermissionContextValue {
  permissions: Permissions | null;
  isLoading: boolean;
  hasPermission: (key: keyof Permissions) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { data: permissions, isLoading } = usePermissions();

  const value = useMemo(
    () => ({
      permissions,
      isLoading,
      hasPermission: (key: keyof Permissions) => permissions?.[key] ?? false,
    }),
    [permissions, isLoading],
  );

  return (
    <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePermissionContext() {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error('usePermissionContext must be used within PermissionProvider');
  return ctx;
}
