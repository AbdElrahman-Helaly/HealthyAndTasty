import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, storeTokens, clearAuthAndRedirect, TOKEN_KEY } from '@/lib/api';
import type { AuthUser, LoginCredentials } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = 'ht_superadmin_user';

function loadStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await api.auth.login(credentials);

      // Persist tokens + expiry via the shared helper (keeps TOKEN_KEY consistent)
      storeTokens(response.accessToken, response.refreshToken, response.user.userId);

      // Persist full user object for session restore on page reload
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));

      setUser(response.user);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    // Use the shared helper so all auth keys are cleared consistently
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('ht_superadmin_refresh_token');
    localStorage.removeItem('ht_superadmin_user_id');
    localStorage.removeItem('ht_superadmin_token_exp');
    localStorage.removeItem(USER_KEY);
    setUser(null);
    // Don't call clearAuthAndRedirect here — the router handles the redirect
    // when isAuthenticated becomes false (ProtectedRoute).
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Re-export for convenience so callers that need the raw redirect helper
// don't have to import from api.ts directly
export { clearAuthAndRedirect };
