import type { Role } from '@/types';

const fullAccess = {
  canManageBranches: true,
  canManageEmployees: true,
  canManageProducts: true,
  canManageCategories: true,
  canSendNotifications: true,
  canViewAuditLogs: true,
  canManageCountries: true,
};

export const mockRoles: Role[] = [
  {
    id: 'role-super-admin',
    name: 'Super Admin',
    description: 'Full access to all portal features',
    permissions: fullAccess,
  },
  {
    id: 'role-country-manager',
    name: 'Country Manager',
    description: 'Manage branches and employees within assigned countries',
    permissions: {
      ...fullAccess,
      canManageCountries: false,
      canViewAuditLogs: false,
    },
  },
  {
    id: 'role-operations',
    name: 'Operations Manager',
    description: 'Manage products, categories, and branch operations',
    permissions: {
      canManageBranches: true,
      canManageEmployees: false,
      canManageProducts: true,
      canManageCategories: true,
      canSendNotifications: true,
      canViewAuditLogs: false,
      canManageCountries: false,
    },
  },
  {
    id: 'role-support',
    name: 'Support Agent',
    description: 'View data and send notifications',
    permissions: {
      canManageBranches: false,
      canManageEmployees: false,
      canManageProducts: false,
      canManageCategories: false,
      canSendNotifications: true,
      canViewAuditLogs: false,
      canManageCountries: false,
    },
  },
  {
    id: 'role-viewer',
    name: 'Viewer',
    description: 'Read-only access',
    permissions: {
      canManageBranches: false,
      canManageEmployees: false,
      canManageProducts: false,
      canManageCategories: false,
      canSendNotifications: false,
      canViewAuditLogs: true,
      canManageCountries: false,
    },
  },
];

export const superAdminRole = mockRoles[0];
