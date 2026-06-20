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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-outline-variant/40 bg-surface/90 px-4 backdrop-blur-md md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <GlobalSearch />

      <div className="ms-auto flex items-center gap-2">
        <CountrySwitcher />

        <button
          onClick={toggleLanguage}
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-outline-variant/60 px-3 py-1.5 text-sm text-primary hover:bg-primary-surface transition-colors"
        >
          <Globe className="h-4 w-4" />
          {i18n.language === 'ar' ? 'EN' : 'AR'}
        </button>

        <Link to="/notifications" className="relative rounded-lg p-2 hover:bg-surface-container transition-colors">
          <Bell className="h-5 w-5 text-on-surface-variant" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 hidden sm:flex">
          <LogOut className="h-4 w-4" />
          {t('common.logout')}
        </Button>
      </div>
    </header>
  );
}
