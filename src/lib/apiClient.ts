import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { env } from '@/config/env';
import type { ApiResponse, AuthUser, BranchAssignment, DashboardAuthResponse, DashboardRole } from '@/types';

// ---------------------------------------------------------------------------
// Auth storage — single source of truth for the dashboard session
// ---------------------------------------------------------------------------

export const AUTH_STORAGE_KEY = 'ht_superadmin_auth';

export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  /** epoch ms — computed from expiresIn at store time */
  expiresAt: number;
  user: AuthUser;
  role: DashboardRole;
  assignedBranches: BranchAssignment[];
  permissions: string[];
}

export function getStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return getStoredAuth()?.accessToken ?? null;
}

/**
 * Persist a dashboard auth response. /me responses carry no tokens — when
 * tokens are absent only the user/role/permissions part is refreshed.
 */
export function storeAuth(response: Partial<DashboardAuthResponse>): StoredAuth {
  const current = getStoredAuth();
  const auth: StoredAuth = {
    accessToken: response.accessToken || current?.accessToken || '',
    refreshToken: response.refreshToken || current?.refreshToken || '',
    expiresAt:
      typeof response.expiresIn === 'number' && response.expiresIn > 0
        ? Date.now() + response.expiresIn * 1000
        : current?.expiresAt ?? 0,
    user: toAuthUser(response, current),
    role: response.role ?? current?.role ?? { id: 0, name: '', displayName: '' },
    assignedBranches: response.assignedBranches ?? current?.assignedBranches ?? [],
    permissions: response.permissions ?? current?.permissions ?? [],
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  return auth;
}

function toAuthUser(
  response: Partial<DashboardAuthResponse>,
  current: StoredAuth | null,
): AuthUser {
  const u = response.user;
  if (!u) return current?.user ?? ({} as AuthUser);
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    name: u.name,
    phone: u.phone,
    email: u.email,
    role: u.role,
    roleId: u.roleId,
    isActive: u.isActive,
    permissions: response.permissions ?? current?.permissions ?? [],
    assignedBranches: response.assignedBranches ?? current?.assignedBranches ?? [],
  };
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function clearAuthAndRedirect(): void {
  clearAuth();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ---------------------------------------------------------------------------
// Central axios instance
// ---------------------------------------------------------------------------

const client = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

/** Endpoints that must never trigger a refresh+retry loop */
function isAuthPath(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/api/dashboard/auth/login') ||
    url.includes('/api/dashboard/auth/refresh') ||
    url.includes('/api/dashboard/auth/logout')
  );
}

/** Proactive refresh when the access token is missing/expired/expiring soon */
async function ensureFreshToken(): Promise<void> {
  const auth = getStoredAuth();
  if (!auth?.refreshToken) return;
  const expiringSoon = !auth.accessToken || Date.now() >= auth.expiresAt - 60_000;
  if (!expiringSoon) return;
  await refreshAndStore();
}

let refreshPromise: Promise<DashboardAuthResponse> | null = null;

async function refreshAndStore(): Promise<DashboardAuthResponse> {
  const auth = getStoredAuth();
  if (!auth?.refreshToken) {
    clearAuthAndRedirect();
    throw new ApiError(401, 'Session expired');
  }
  // Serialise: concurrent callers await the same in-flight refresh
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await axios.post<ApiResponse<DashboardAuthResponse>>(
        `${env.apiBaseUrl}/api/dashboard/auth/refresh`,
        { refreshToken: auth.refreshToken } as Record<string, unknown>,
        { headers: { 'Content-Type': 'application/json' } },
      );
      const body = res.data;
      if (!body.success || !body.data) {
        throw new ApiError(401, body.message || 'Session expired');
      }
      storeAuth(body.data);
      return body.data;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

client.interceptors.request.use(
  async (config) => {
    // Let the browser add the multipart boundary for every FormData request.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      config.headers.delete('Content-Type');
    }
    // Never refresh / attach a token for auth endpoints (login, refresh, logout).
    // Otherwise a stale stored refreshToken would be sent before login itself.
    if (!isAuthPath(config.url)) {
      await ensureFreshToken();
      const token = getAccessToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.response.use(
  (response) => {
    // Unwrap the ApiResponse<T> envelope: consumers receive `data` directly
    const body = response.data as unknown;
    if (
      body &&
      typeof body === 'object' &&
      'success' in body
    ) {
      const envelope = body as ApiResponse<unknown>;
      if (!envelope.success) {
        throw new ApiError(
          envelope.statusCode || 400,
          envelope.message || 'Request failed',
          envelope.errors ?? [],
        );
      }
      response.data = envelope.data;
    }
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const { response, config } = error;
    const original = config as AxiosRequestConfig & { _retried?: boolean };

    // Reactive 401 handling — refresh once, then retry the original request
    if (response?.status === 401 && !original._retried && !isAuthPath(original.url)) {
      original._retried = true;
      try {
        await refreshAndStore();
        return client(original);
      } catch {
        clearAuthAndRedirect();
      }
    }

    if (response?.data && typeof response.data === 'object') {
      const body = response.data;
      const message =
        typeof body.message === 'string' && body.message
          ? body.message
          : `Request failed (${response.status})`;
      return Promise.reject(
        new ApiError(response.status, message, Array.isArray(body.errors) ? body.errors : []),
      );
    }

    return Promise.reject(
      new ApiError(response?.status ?? 0, error.message || 'Network error'),
    );
  },
);

// ---------------------------------------------------------------------------
// Typed helpers — every API module routes through here
// ---------------------------------------------------------------------------

export const http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return client.get<T, AxiosResponse<T>>(url, config).then((r) => r.data);
  },
  post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return client.post<T, AxiosResponse<T>>(url, body, config).then((r) => r.data);
  },
  put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return client.put<T, AxiosResponse<T>>(url, body, config).then((r) => r.data);
  },
  patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return client.patch<T, AxiosResponse<T>>(url, body, config).then((r) => r.data);
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return client.delete<T, AxiosResponse<T>>(url, config).then((r) => r.data);
  },
};
