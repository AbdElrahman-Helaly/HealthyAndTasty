import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';

interface PermissionContextValue {
  /** Exact permission name strings granted to the current user (from Login/Me) */
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { permissions } = useAuth();

  const hasPermission = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions],
  );

  const hasAnyPermission = useCallback(
    (...names: string[]) => names.some((name) => permissions.includes(name)),
    [permissions],
  );

  const value = useMemo(
    () => ({ permissions, hasPermission, hasAnyPermission }),
    [permissions, hasPermission, hasAnyPermission],
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
