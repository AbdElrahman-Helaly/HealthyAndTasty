/**
 * Employee service — all employee-related API calls go through here.
 * Pages and components must never call fetch() directly.
 */
import { api } from '@/lib/api';
import type {
  ApiRole,
  CursorPagedResponse,
  Employee,
  EmployeeDetails,
  EmployeeUpdateRequest,
} from '@/types';

/**
 * Fetch a page of employees.
 * @param limit  How many items per page (default 20).
 * @param cursor Pagination cursor from the previous response's `nextCursor`.
 */
export async function getEmployees(
  limit = 20,
  cursor?: string,
): Promise<CursorPagedResponse<Employee>> {
  return api.employees.list(limit, cursor);
}

/**
 * Fetch a single employee by ID.
 * Loads branch details on demand — do NOT preload.
 */
export async function getEmployeeById(id: string): Promise<EmployeeDetails | null> {
  return api.employees.getById(id);
}

/**
 * Update an employee's profile fields.
 */
export async function updateEmployee(
  id: string,
  payload: EmployeeUpdateRequest,
): Promise<Employee> {
  return api.employees.update(id, payload);
}

/**
 * Delete an employee permanently.
 */
export async function deleteEmployee(id: string): Promise<void> {
  return api.employees.delete(id);
}

/**
 * Fetch available roles from the backend.
 * Returns strings like ["User","Admin","SuperAdmin","Employee"].
 */
export async function getRoles(): Promise<ApiRole[]> {
  return api.roles.list();
}

/**
 * Change the role of a user (by userId, not employeeId).
 */
export async function changeUserRole(userId: string, role: string): Promise<void> {
  return api.users.changeRole(userId, role);
}
