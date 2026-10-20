import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePermissionContext } from '@/context/PermissionContext';
import { PageLoader } from '@/components/ui/Spinner';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Route requires the user to hold ANY of these permissions */
  requiredPermissions?: string[];
  /** Route requires the user to hold ANY of these roles (case-insensitive contains) */
  requiredRoles?: string[];
}

export function ProtectedRoute({
  children,
  requiredPermissions,
  requiredRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, isRestoring, user } = useAuth();
  const { hasAnyPermission } = usePermissionContext();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isRestoring) {
    return <PageLoader />;
  }

  if (user?.role.toLowerCase() === 'branchemployee') {
    const allowed = /^\/orders(?:\/\d+)?\/?$/.test(location.pathname) || /^\/inventory\/?$/.test(location.pathname);
    return allowed ? <>{children}</> : <Navigate to="/orders" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const role = user?.role ?? '';
    const allowed = requiredRoles.some((r) => role.toLowerCase().includes(r.toLowerCase()));
    if (!allowed) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    if (!hasAnyPermission(...requiredPermissions)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
