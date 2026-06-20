/**
 * Branch service — all branch-related API calls go through here.
 * Pages and components must never call fetch() directly.
 */
import { api } from '@/lib/api';
import type {
  Branch,
  BranchEmployee,
  ChangeEmployeeRoleRequest,
  CreateBranchEmployeeRequest,
  CreateBranchRequest,
  EmployeeRole,
  PaginatedResponse,
  UpdateBranchRequest,
} from '@/types';

// ---------------------------------------------------------------------------
// Branches
// ---------------------------------------------------------------------------

export async function getBranches(country?: string): Promise<Branch[]> {
  return api.branches.list(country);
}

export async function getBranchById(id: string): Promise<Branch | null> {
  return api.branches.getById(id);
}

export async function createBranch(payload: CreateBranchRequest): Promise<Branch> {
  return api.branches.create(payload);
}

export async function updateBranch(id: string, payload: UpdateBranchRequest): Promise<Branch> {
  return api.branches.update(id, payload);
}

export async function deleteBranch(id: string): Promise<void> {
  return api.branches.delete(id);
}

// ---------------------------------------------------------------------------
// Branch Employees
// ---------------------------------------------------------------------------

export async function getBranchEmployees(params: {
  page?: number;
  pageSize?: number;
  branchId?: string;
}): Promise<PaginatedResponse<BranchEmployee>> {
  return api.branchEmployees.list(params);
}

export async function createBranchEmployee(
  payload: CreateBranchEmployeeRequest,
): Promise<BranchEmployee> {
  return api.branchEmployees.create(payload);
}

export async function changeBranchEmployeeRole(
  id: string,
  payload: ChangeEmployeeRoleRequest,
): Promise<void> {
  return api.branchEmployees.changeRole(id, payload);
}

export async function getBranchEmployeeRoles(): Promise<EmployeeRole[]> {
  return api.branchEmployees.getRoles();
}
