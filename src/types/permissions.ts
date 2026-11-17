// ---------------------------------------------------------------------------
// Permission names — exact strings returned by the Healthy & Tasty dashboard
// backend (/api/dashboard/auth/login, /api/dashboard/auth/me).
// ---------------------------------------------------------------------------

export const PERMISSIONS = {
  EmployeesView: 'Employees.View',
  EmployeesCreate: 'Employees.Create',
  EmployeesUpdate: 'Employees.Update',
  EmployeesActivate: 'Employees.Activate',
  EmployeesDeactivate: 'Employees.Deactivate',
  EmployeesAssignRole: 'Employees.AssignRole',
  EmployeesAssignBranch: 'Employees.AssignBranch',
  OrdersView: 'Orders.View',
  OrdersUpdateStatus: 'Orders.UpdateStatus',
  OrdersCancel: 'Orders.Cancel',
  LoyaltySettingsView: 'Loyalty.Settings.View',
  LoyaltySettingsManage: 'Loyalty.Settings.Manage',
  LoyaltyWalletsView: 'Loyalty.Wallets.View',
  LoyaltyWalletsAdjust: 'Loyalty.Wallets.Adjust',
  LoyaltyReportsView: 'Loyalty.Reports.View',
  NotificationsSend: 'Notifications.Send',
  ReportsView: 'Reports.View',
  ReportsExport: 'Reports.Export',
  BranchesView: 'Branches.View',
  BranchesManage: 'Branches.Manage',
  RolesView: 'Roles.View',
  RolesManage: 'Roles.Manage',
  DashboardView: 'Dashboard.View',
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const LOYALTY_VIEW_PERMISSIONS = [
  PERMISSIONS.LoyaltySettingsView,
  PERMISSIONS.LoyaltyWalletsView,
  PERMISSIONS.LoyaltyReportsView,
];

export function hasLoyaltyRole(role?: string | null): boolean {
  return ['admin', 'generalmanager'].includes(role?.toLowerCase() ?? '');
}

/** All known permission names as a set (for building checkboxes/matrices) */
export const ALL_PERMISSIONS: readonly PermissionName[] = Object.values(PERMISSIONS);
