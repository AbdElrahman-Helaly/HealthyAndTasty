import { useCallback, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { listUsers } from '@/api/users.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { usePermissionContext } from '@/context/PermissionContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { UserManagement } from '@/types';
import { hasLoyaltyRole, PERMISSIONS } from '@/types/permissions';
import { LoyaltyResult } from './LoyaltyComponents';
import { LoyaltyReportsPanel } from './LoyaltyReportsPanel';
import { LoyaltySettingsPanel } from './LoyaltySettingsPanel';
import { LoyaltyWalletPanel } from './LoyaltyWalletPanel';
import { useLoyaltyQuery } from './useLoyaltyQuery';

const sections = [
  { key: 'settings', permission: PERMISSIONS.LoyaltySettingsView },
  { key: 'wallets', permission: PERMISSIONS.LoyaltyWalletsView },
  { key: 'reports', permission: PERMISSIONS.LoyaltyReportsView },
] as const;

function LoyaltyWorkspace() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasPermission } = usePermissionContext();
  const [selected, setSelected] = useState<typeof sections[number]['key']>();
  const [statisticsRevision, setStatisticsRevision] = useState(0);
  const visible = sections.filter(({ permission }) => hasPermission(permission));
  const active = visible.find(({ key }) => key === selected)?.key ?? visible[0]?.key;
  const isAdmin = user?.role.toLowerCase() === 'admin';
  const wallets = hasPermission(PERMISSIONS.LoyaltyWalletsView);
  const reports = hasPermission(PERMISSIONS.LoyaltyReportsView);
  const canFindCustomers = wallets || reports;

  const loadCustomers = useCallback(async () => {
    const registered = new Map<number, UserManagement>();
    if (!canFindCustomers) return [];
    const pageSize = 100;
    for (let page = 1; ; page += 1) {
      const result = await listUsers({ page, pageSize });
      for (const user of result.items) {
        if (['user', 'customer'].includes(user.role?.trim().toLowerCase()) && user.id > 0) {
          registered.set(user.id, user);
        }
      }
      if (!result.items.length || page >= (result.totalPages || Math.ceil(result.totalCount / result.pageSize))) break;
    }
    return [...registered.values()];
  }, [canFindCustomers]);
  const customers = useLoyaltyQuery(loadCustomers);
  usePageTitle(t('loyalty.title'));

  return (
    <div className="space-y-4">
      <PageHeader title={t('loyalty.title')} />
      <nav aria-label={t('loyalty.title')} className="flex flex-wrap gap-2">
        {visible.map(({ key }) => (
          <Button
            key={key}
            size="sm"
            variant={active === key ? 'primary' : 'secondary'}
            aria-pressed={active === key}
            onClick={() => setSelected(key)}
          >
            {t(`loyalty.${key}`)}
          </Button>
        ))}
      </nav>
      {hasPermission(PERMISSIONS.LoyaltySettingsView) && (
        <section hidden={active !== 'settings'} aria-label={t('loyalty.settings')}>
          <LoyaltySettingsPanel canManage={isAdmin && hasPermission(PERMISSIONS.LoyaltySettingsManage)} />
        </section>
      )}
      {wallets && (
        <section hidden={active !== 'wallets'} aria-label={t('loyalty.wallets')}>
          <LoyaltyResult query={customers}>
            {(items) => (
              <LoyaltyWalletPanel
                customers={items}
                canAdjust={isAdmin && hasPermission(PERMISSIONS.LoyaltyWalletsAdjust)}
                onAdjusted={() => setStatisticsRevision((previous) => previous + 1)}
              />
            )}
          </LoyaltyResult>
        </section>
      )}
      {reports && (
        <section hidden={active !== 'reports'} aria-label={t('loyalty.reports')}>
          <LoyaltyReportsPanel customers={customers} revision={statisticsRevision} />
        </section>
      )}
    </div>
  );
}

export function LoyaltyPage() {
  const { user } = useAuth();
  return hasLoyaltyRole(user?.role) ? <LoyaltyWorkspace /> : <Navigate to="/unauthorized" replace />;
}
