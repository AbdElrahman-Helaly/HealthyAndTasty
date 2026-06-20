import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';

export function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  usePageTitle(t('settings.title'));

  return (
    <div>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.profile')}</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3 text-sm">
            <div>
              <p className="text-on-surface-variant">Name</p>
              <p className="font-medium">{user?.displayName}</p>
            </div>
            <div>
              <p className="text-on-surface-variant">كود الموظف</p>
              <p className="font-medium">{user?.employeeCode}</p>
            </div>
            <div>
              <p className="text-on-surface-variant">الدور</p>
              <p className="font-medium">{user?.roleName}</p>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.preferences')}</CardTitle>
          </CardHeader>
          <p className="text-sm text-on-surface-variant">
            Portal preferences and system configuration will be available when the settings API is ready.
          </p>
        </Card>
      </div>
    </div>
  );
}
