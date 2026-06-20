import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout';
import { PageLoader } from '@/components/ui/Spinner';
import { LoginPage } from '@/pages/LoginPage';

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const CountriesPage = lazy(() =>
  import('@/pages/countries/CountriesPage').then((m) => ({ default: m.CountriesPage })),
);
const CountryDetailsPage = lazy(() =>
  import('@/pages/countries/CountryDetailsPage').then((m) => ({ default: m.CountryDetailsPage })),
);
const CategoriesPage = lazy(() =>
  import('@/pages/categories/CategoriesPage').then((m) => ({ default: m.CategoriesPage })),
);
const CategoryDetailsPage = lazy(() =>
  import('@/pages/categories/CategoryDetailsPage').then((m) => ({ default: m.CategoryDetailsPage })),
);
const BranchesPage = lazy(() =>
  import('@/pages/branches/BranchesPage').then((m) => ({ default: m.BranchesPage })),
);
const BranchDetailsPage = lazy(() =>
  import('@/pages/branches/BranchDetailsPage').then((m) => ({ default: m.BranchDetailsPage })),
);
const EmployeesPage = lazy(() =>
  import('@/pages/employees/EmployeesPage').then((m) => ({ default: m.EmployeesPage })),
);
const EmployeeDetailsPage = lazy(() =>
  import('@/pages/employees/EmployeeDetailsPage').then((m) => ({ default: m.EmployeeDetailsPage })),
);
const ProductsPage = lazy(() =>
  import('@/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })),
);
const NotificationsPage = lazy(() =>
  import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
);
const AuditLogsPage = lazy(() =>
  import('@/pages/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })),
);
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const AddressesPage = lazy(() =>
  import('@/pages/addresses/AddressesPage').then((m) => ({ default: m.AddressesPage })),
);
const BannersPage = lazy(() =>
  import('@/pages/BannersPage').then((m) => ({ default: m.BannersPage })),
);
const DiscountsPage = lazy(() =>
  import('@/pages/DiscountsPage').then((m) => ({ default: m.DiscountsPage })),
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
            <Route path="dashboard" element={<LazyPage><DashboardPage /></LazyPage>} />
            <Route path="countries" element={<LazyPage><CountriesPage /></LazyPage>} />
            <Route path="countries/:id" element={<LazyPage><CountryDetailsPage /></LazyPage>} />
            <Route path="categories" element={<LazyPage><CategoriesPage /></LazyPage>} />
            <Route path="categories/:id" element={<LazyPage><CategoryDetailsPage /></LazyPage>} />
            <Route path="branches" element={<LazyPage><BranchesPage /></LazyPage>} />
            <Route path="branches/:id" element={<LazyPage><BranchDetailsPage /></LazyPage>} />
            <Route path="employees" element={<LazyPage><EmployeesPage /></LazyPage>} />
            <Route path="employees/:id" element={<LazyPage><EmployeeDetailsPage /></LazyPage>} />
            <Route path="products" element={<LazyPage><ProductsPage /></LazyPage>} />
            <Route path="addresses" element={<LazyPage><AddressesPage /></LazyPage>} />
            <Route path="banners" element={<LazyPage><BannersPage /></LazyPage>} />
            <Route path="discounts" element={<LazyPage><DiscountsPage /></LazyPage>} />
            <Route path="notifications" element={<LazyPage><NotificationsPage /></LazyPage>} />
            <Route path="audit-logs" element={<LazyPage><AuditLogsPage /></LazyPage>} />
            <Route path="settings" element={<LazyPage><SettingsPage /></LazyPage>} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
