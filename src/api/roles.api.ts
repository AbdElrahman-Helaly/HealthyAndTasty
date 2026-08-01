import { http } from '@/lib/apiClient';
import type { PermissionDto, RoleDto, SetRolePermissionsRequest } from '@/types';

/** GET /api/dashboard/roles */
export function listRoles(): Promise<RoleDto[]> {
  return http.get<RoleDto[]>('/api/dashboard/roles');
}

/** GET /api/dashboard/permissions */
export function listPermissions(): Promise<PermissionDto[]> {
  return http.get<PermissionDto[]>('/api/dashboard/permissions');
}

/** GET /api/dashboard/roles/{roleId}/permissions */
export function getRolePermissions(roleId: number): Promise<PermissionDto[]> {
  return http.get<PermissionDto[]>(`/api/dashboard/roles/${encodeURIComponent(String(roleId))}/permissions`);
}

/** PUT /api/dashboard/roles/{roleId}/permissions */
export function setRolePermissions(roleId: number, body: SetRolePermissionsRequest): Promise<unknown> {
  return http.put<unknown>(
    `/api/dashboard/roles/${encodeURIComponent(String(roleId))}/permissions`,
    body,
  );
}
