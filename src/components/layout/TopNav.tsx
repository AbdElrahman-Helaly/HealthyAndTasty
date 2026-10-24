import { useTranslation } from 'react-i18next';
import { Bell, Menu, LogOut, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { GlobalSearch } from './GlobalSearch';
import { useAuth } from '@/context/AuthContext';
import { BranchOrderNotifications } from './BranchOrderNotifications';

interface TopNavProps {
  onMenuClick: () => void;
  unreadCount?: number;
}

export function TopNav({ onMenuClick, unreadCount = 0 }: TopNavProps) {
  const { t, i18n } = useTranslation();
  const { logout, user } = useAuth();
  const branchRole = ['branchemployee', 'branchmanager'].includes(user?.role.toLowerCase() ?? '');

  function toggleLanguage() {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    void i18n.changeLanguage(next);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 px-4 md:px-6 glass-strong">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-4 w-4" />
      </Button>

      {!branchRole && <GlobalSearch />}

      <div className="ms-auto flex items-center gap-2">
        <button
          onClick={toggleLanguage}
          className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-xl border border-outline-variant/40 px-3 text-xs font-semibold text-primary hover:bg-primary-surface transition-all"
        >
          <Globe className="h-3.5 w-3.5" />
          {i18n.language === 'ar' ? 'EN' : 'AR'}
        </button>

        {branchRole ? <BranchOrderNotifications key={user?.id} /> : <Link
          to="/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-accent to-orange-400 text-[8px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>}

        <div className="mx-1 h-6 w-px bg-outline-variant/30" />

        <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 hidden sm:flex h-9 text-xs">
          <LogOut className="h-3.5 w-3.5" />
          {t('common.logout')}
        </Button>
      </div>
    </header>
  );
}
