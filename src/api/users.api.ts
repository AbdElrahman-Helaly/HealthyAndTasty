import { http } from '@/lib/apiClient';
import type {
  AssignUserBranchRequest,
  PagedResult,
  UpdateUserRoleRequest,
  UserManagement,
} from '@/types';

export interface UserListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

/** GET /api/admin/users */
export function listUsers(params: UserListParams = {}): Promise<PagedResult<UserManagement>> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
  const query = qs.toString();
  return http.get<PagedResult<UserManagement>>(`/api/admin/users${query ? `?${query}` : ''}`);
}

/** GET /api/admin/users/branch/{branchId}/employees */
export function listUsersByBranch(branchId: string): Promise<UserManagement[]> {
  return http.get<UserManagement[]>(
    `/api/admin/users/branch/${encodeURIComponent(branchId)}/employees`,
  );
}

/** PUT /api/admin/users/role */
export function updateUserRole(body: UpdateUserRoleRequest): Promise<unknown> {
  return http.put<unknown>('/api/admin/users/role', body);
}

/** DELETE /api/admin/users/{id} — Admin only */
export function deleteUser(id: number): Promise<unknown> {
  return http.delete<unknown>(`/api/admin/users/${encodeURIComponent(String(id))}`);
}

/** POST /api/admin/users/assign-branch */
export function assignUserBranch(body: AssignUserBranchRequest): Promise<unknown> {
  return http.post<unknown>('/api/admin/users/assign-branch', body);
}

/** POST /api/admin/users/remove-branch */
export function removeUserBranch(body: AssignUserBranchRequest): Promise<unknown> {
  return http.post<unknown>('/api/admin/users/remove-branch', body);
}
