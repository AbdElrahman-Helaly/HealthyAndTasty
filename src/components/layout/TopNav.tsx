import { useTranslation } from 'react-i18next';
import { Bell, Menu, LogOut, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { GlobalSearch } from './GlobalSearch';
import { CountrySwitcher } from './CountrySwitcher';
import { useAuth } from '@/context/AuthContext';

interface TopNavProps {
  onMenuClick: () => void;
  unreadCount?: number;
}

export function TopNav({ onMenuClick, unreadCount = 0 }: TopNavProps) {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();

  function toggleLanguage() {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    void i18n.changeLanguage(next);
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-outline-variant/20 bg-surface/80 px-4 backdrop-blur-lg md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-4 w-4" />
      </Button>

      <GlobalSearch />

      <div className="ms-auto flex items-center gap-1.5">
        <CountrySwitcher />

        <button
          onClick={toggleLanguage}
          className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-lg border border-outline-variant/40 px-2.5 text-xs font-semibold text-primary hover:bg-primary-surface transition-colors"
        >
          <Globe className="h-3.5 w-3.5" />
          {i18n.language === 'ar' ? 'EN' : 'AR'}
        </button>

        <Link
          to="/notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -end-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="mx-1 h-5 w-px bg-outline-variant/40" />

        <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 hidden sm:flex h-8 text-xs">
          <LogOut className="h-3.5 w-3.5" />
          {t('common.logout')}
        </Button>
      </div>
    </header>
  );
}
