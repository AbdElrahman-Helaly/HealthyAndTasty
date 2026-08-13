import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout';
import { PageLoader } from '@/components/ui/Spinner';
import { LoginPage } from '@/pages/LoginPage';
import { PERMISSIONS } from '@/types/permissions';

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const OrdersPage = lazy(() =>
  import('@/pages/orders/OrdersPage').then((m) => ({ default: m.OrdersPage })),
);
const OrderDetailsPage = lazy(() =>
  import('@/pages/orders/OrderDetailsPage').then((m) => ({ default: m.OrderDetailsPage })),
);
const LiveOrdersPage = lazy(() =>
  import('@/pages/orders/LiveOrdersPage').then((m) => ({ default: m.LiveOrdersPage })),
);
const EmployeesPage = lazy(() =>
  import('@/pages/employees/EmployeesPage').then((m) => ({ default: m.EmployeesPage })),
);
const EmployeeDetailsPage = lazy(() =>
  import('@/pages/employees/EmployeeDetailsPage').then((m) => ({ default: m.EmployeeDetailsPage })),
);
const RolesPage = lazy(() =>
  import('@/pages/roles/RolesPage').then((m) => ({ default: m.RolesPage })),
);
const RolePermissionsPage = lazy(() =>
  import('@/pages/roles/RolePermissionsPage').then((m) => ({ default: m.RolePermissionsPage })),
);
const BranchesPage = lazy(() =>
  import('@/pages/branches/BranchesPage').then((m) => ({ default: m.BranchesPage })),
);
const ShippingRatesPage = lazy(() =>
  import('@/pages/shipping/ShippingRatesPage').then((m) => ({ default: m.ShippingRatesPage })),
);
const ReportsPage = lazy(() =>
  import('@/pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const StatisticsPage = lazy(() =>
  import('@/pages/statistics/StatisticsPage').then((m) => ({ default: m.StatisticsPage })),
);
const NotificationsPage = lazy(() =>
  import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
);
const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const UnauthorizedPage = lazy(() =>
  import('@/pages/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [isRTL, i18n.language]);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className={isRTL ? 'font-arabic' : 'font-sans'}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.DashboardView]}>
                  <LazyPage><DashboardPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.OrdersView]}>
                  <LazyPage><OrdersPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="orders/:id"
              element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.OrdersView]}>
                  <LazyPage><OrderDetailsPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="live-orders"
              element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.OrdersView]}>
                  <LazyPage><LiveOrdersPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="employees"
              element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.EmployeesView]}>
                  <LazyPage><EmployeesPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/:id"
              element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.EmployeesView]}>
                  <LazyPage><EmployeeDetailsPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="roles"
              element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.RolesView]}>
                  <LazyPage><RolesPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="roles/:roleId/permissions"
              element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.RolesManage]}>
                  <LazyPage><RolePermissionsPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="branches"
              element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.BranchesView]}>
                  <LazyPage><BranchesPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping-rates"
              element={
                <ProtectedRoute requiredRoles={['admin', 'generalmanager', 'branchmanager']}>
                  <LazyPage><ShippingRatesPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.ReportsView]}>
                  <LazyPage><ReportsPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="statistics"
              element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.ReportsView]}>
                  <LazyPage><StatisticsPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="notifications"
              element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.NotificationsSend]}>
                  <LazyPage><NotificationsPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route path="profile" element={<LazyPage><ProfilePage /></LazyPage>} />
            <Route path="unauthorized" element={<LazyPage><UnauthorizedPage /></LazyPage>} />
          </Route>
          <Route path="*" element={<LazyPage><NotFoundPage /></LazyPage>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
