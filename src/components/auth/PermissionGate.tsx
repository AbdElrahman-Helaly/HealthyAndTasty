import type { ReactNode } from 'react';
import { usePermissionContext } from '@/context/PermissionContext';

/**
 * Conditionally renders children when the current user holds the permission.
 * Used to hide buttons/actions based on the permissions from Login/Me.
 */
export function PermissionGate({
  permission,
  fallback = null,
  children,
}: {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { hasPermission } = usePermissionContext();
  if (!hasPermission(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
