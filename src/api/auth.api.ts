import { http } from '@/lib/apiClient';
import type { DashboardAuthResponse, DashboardLoginRequest, LogoutRequest } from '@/types';

/** POST /api/dashboard/auth/login */
export function login(credentials: DashboardLoginRequest): Promise<DashboardAuthResponse> {
  return http.post<DashboardAuthResponse>('/api/dashboard/auth/login', credentials);
}

/** POST /api/dashboard/auth/refresh */
export function refresh(refreshToken: string): Promise<DashboardAuthResponse> {
  return http.post<DashboardAuthResponse>('/api/dashboard/auth/refresh', { refreshToken });
}

/** POST /api/dashboard/auth/logout */
export function logout(body: LogoutRequest): Promise<unknown> {
  return http.post<unknown>('/api/dashboard/auth/logout', body);
}

/** GET /api/dashboard/auth/me */
export function me(): Promise<DashboardAuthResponse> {
  return http.get<DashboardAuthResponse>('/api/dashboard/auth/me');
}
