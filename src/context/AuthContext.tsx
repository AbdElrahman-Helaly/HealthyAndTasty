import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getStoredAuth,
  storeAuth,
  clearAuth,
} from '@/lib/apiClient';
import { login as loginRequest, me as meRequest, logout as logoutRequest } from '@/api/auth.api';
import type { AuthUser, BranchAssignment, DashboardLoginRequest, DashboardRole } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  role: DashboardRole | null;
  permissions: string[];
  assignedBranches: BranchAssignment[];
  isAuthenticated: boolean;
  /** true while the initial session restore (/me) is in flight */
  isRestoring: boolean;
  /** login request in progress */
  isLoading: boolean;
  login: (credentials: DashboardLoginRequest) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  /** Re-fetch /me and refresh stored user/permissions */
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function restoreInitial(): {
  user: AuthUser | null;
  role: DashboardRole | null;
  permissions: string[];
  assignedBranches: BranchAssignment[];
} {
  const stored = getStoredAuth();
  if (!stored) return { user: null, role: null, permissions: [], assignedBranches: [] };
  return {
    user: stored.user,
    role: stored.role,
    permissions: stored.permissions,
    assignedBranches: stored.assignedBranches,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = useState(restoreInitial)[0];
  const [user, setUser] = useState<AuthUser | null>(initial.user);
  const [role, setRole] = useState<DashboardRole | null>(initial.role);
  const [permissions, setPermissions] = useState<string[]>(initial.permissions);
  const [assignedBranches, setAssignedBranches] = useState<BranchAssignment[]>(
    initial.assignedBranches,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(() => Boolean(getStoredAuth()));

  const applyAuth = useCallback((response: {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    user?: AuthUser;
    role?: DashboardRole;
    permissions?: string[];
    assignedBranches?: BranchAssignment[];
  }) => {
    if (response.user) setUser(response.user);
    if (response.role) setRole(response.role);
    if (response.permissions) setPermissions(response.permissions);
    if (response.assignedBranches) setAssignedBranches(response.assignedBranches);
  }, []);

  const login = useCallback(async (credentials: DashboardLoginRequest) => {
    setIsLoading(true);
    try {
      const response = await loginRequest(credentials);
      const stored = storeAuth(response);
      applyAuth({
        user: stored.user,
        role: stored.role,
        permissions: stored.permissions,
        assignedBranches: stored.assignedBranches,
      });
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Login failed',
      };
    } finally {
      setIsLoading(false);
    }
  }, [applyAuth]);

  const logout = useCallback(async () => {
    const stored = getStoredAuth();
    if (stored?.refreshToken) {
      try {
        await logoutRequest({ refreshToken: stored.refreshToken });
      } catch {
        // best effort — session is cleared regardless
      }
    }
    clearAuth();
    setUser(null);
    setRole(null);
    setPermissions([]);
    setAssignedBranches([]);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const response = await meRequest();
      // /me carries no tokens — refresh only the profile part
      const stored = storeAuth(response);
      setUser(stored.user);
      setRole(stored.role);
      setPermissions(stored.permissions);
      setAssignedBranches(stored.assignedBranches);
    } catch {
      // 401 already handled by the client (refresh → retry → logout)
      setUser(null);
      setRole(null);
      setPermissions([]);
      setAssignedBranches([]);
    } finally {
      setIsRestoring(false);
    }
  }, []);

  // Restore the session on mount — validates stored tokens via /me
  useEffect(() => {
    if (getStoredAuth()) {
      void refreshSession();
    }
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      user,
      role,
      permissions,
      assignedBranches,
      isAuthenticated: user !== null,
      isRestoring,
      isLoading,
      login,
      logout,
      refreshSession,
    }),
    [user, role, permissions, assignedBranches, isRestoring, isLoading, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
