import { http } from '@/lib/apiClient';
import type { BranchAdmin, CreateBranchRequest, UpdateBranchRequest } from '@/types';

/** GET /api/admin/branches */
export function listBranches(): Promise<BranchAdmin[]> {
  return http.get<BranchAdmin[]>('/api/admin/branches');
}

/** POST /api/v1/branches */
export function createBranch(body: CreateBranchRequest): Promise<BranchAdmin> {
  return http.post<BranchAdmin>('/api/v1/branches', body);
}
/** PUT /api/v1/branches/{id} */
export function updateBranch(id: number, body: UpdateBranchRequest): Promise<BranchAdmin> {
  return http.put<BranchAdmin>(`/api/v1/branches/${id}`, body);
}
