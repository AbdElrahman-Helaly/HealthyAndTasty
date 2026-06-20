import { superAdminRole, mockRoles } from '@/data/mockRoles';
import type { Permissions, Role } from '@/types';

export async function getCurrentRole(): Promise<Role> {
  // Future: return api.permissions.getCurrentRole();
  return superAdminRole;
}

export async function getPermissions(): Promise<Permissions> {
  const role = await getCurrentRole();
  return role.permissions;
}

export async function getRoles(): Promise<Role[]> {
  // Future: return api.permissions.getRoles();
  return mockRoles;
}
