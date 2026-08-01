import { http } from '@/lib/apiClient';
import type { BranchAdmin, UpdateBranchRequest } from '@/types';

/** GET /api/admin/branches */
export function listBranches(): Promise<BranchAdmin[]> {
  return http.get<BranchAdmin[]>('/api/admin/branches');
}

/** PUT /api/admin/branches/{id} — Admin only */
export function updateBranch(id: string, body: UpdateBranchRequest): Promise<BranchAdmin> {
  return http.put<BranchAdmin>(`/api/admin/branches/${encodeURIComponent(id)}`, body);
}
