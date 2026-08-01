import { http } from '@/lib/apiClient';
import type {
  AssignBranchesRequest,
  AssignRoleRequest,
  CreateEmployeeRequest,
  Employee,
  EmployeeDetail,
  PagedResult,
  UpdateEmployeeRequest,
} from '@/types';

export interface EmployeeListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

/** GET /api/dashboard/employees */
export function listEmployees(params: EmployeeListParams = {}): Promise<PagedResult<Employee>> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
  const query = qs.toString();
  return http.get<PagedResult<Employee>>(`/api/dashboard/employees${query ? `?${query}` : ''}`);
}

/** POST /api/dashboard/employees — returns temporaryPassword once */
export function createEmployee(body: CreateEmployeeRequest): Promise<EmployeeDetail> {
  return http.post<EmployeeDetail>('/api/dashboard/employees', body);
}

/** GET /api/dashboard/employees/{id} */
export function getEmployee(id: number | string): Promise<Employee> {
  return http.get<Employee>(`/api/dashboard/employees/${encodeURIComponent(String(id))}`);
}

/** PUT /api/dashboard/employees/{id} */
export function updateEmployee(id: number | string, body: UpdateEmployeeRequest): Promise<Employee> {
  return http.put<Employee>(`/api/dashboard/employees/${encodeURIComponent(String(id))}`, body);
}

/** PUT /api/dashboard/employees/{id}/activate */
export function activateEmployee(id: number | string): Promise<Employee> {
  return http.put<Employee>(`/api/dashboard/employees/${encodeURIComponent(String(id))}/activate`);
}

/** PUT /api/dashboard/employees/{id}/deactivate */
export function deactivateEmployee(id: number | string): Promise<Employee> {
  return http.put<Employee>(`/api/dashboard/employees/${encodeURIComponent(String(id))}/deactivate`);
}

/** PUT /api/dashboard/employees/{id}/branches */
export function assignEmployeeBranches(
  id: number | string,
  body: AssignBranchesRequest,
): Promise<Employee> {
  return http.put<Employee>(
    `/api/dashboard/employees/${encodeURIComponent(String(id))}/branches`,
    body,
  );
}

/** PUT /api/dashboard/employees/{id}/role */
export function assignEmployeeRole(id: number | string, body: AssignRoleRequest): Promise<Employee> {
  return http.put<Employee>(
    `/api/dashboard/employees/${encodeURIComponent(String(id))}/role`,
    body,
  );
}
