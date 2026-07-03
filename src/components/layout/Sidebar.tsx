import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Globe,
  FolderTree,
  Building2,
  Users,
  Package,
  MapPin,
  Image,
  Tag,
  Bell,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { branding } from '@/config/branding';
import { cn, getInitials } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  labelKey: string;
}

interface NavGroup {
  labelKey?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [{ to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' }],
  },
  {
    labelKey: 'nav.sectionManagement',
    items: [
      { to: '/countries', icon: Globe, labelKey: 'nav.countries' },
      { to: '/categories', icon: FolderTree, labelKey: 'nav.categories' },
      { to: '/branches', icon: Building2, labelKey: 'nav.branches' },
      { to: '/employees', icon: Users, labelKey: 'nav.employees' },
      { to: '/products', icon: Package, labelKey: 'nav.products' },
      { to: '/addresses', icon: MapPin, labelKey: 'nav.addresses' },
    ],
  },
  {
    labelKey: 'nav.sectionMarketing',
    items: [
      { to: '/banners', icon: Image, labelKey: 'nav.banners' },
      { to: '/discounts', icon: Tag, labelKey: 'nav.discounts' },
      { to: '/notifications', icon: Bell, labelKey: 'nav.notifications' },
    ],
  },
  {
    labelKey: 'nav.sectionSystem',
    items: [
      { to: '/audit-logs', icon: ScrollText, labelKey: 'nav.auditLogs' },
      { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
    ],
  },
];

function SidebarNavItem({ item, collapsed, onMobileClose }: { item: NavItem; collapsed: boolean; onMobileClose?: () => void }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  return (
    <NavLink
      to={item.to}
      onClick={onMobileClose}
      title={collapsed ? t(item.labelKey) : undefined}
      className={({ isActive }) =>
        cn(
          'sidebar-nav-item group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
          collapsed ? 'justify-center mx-2' : 'mx-2',
          isActive
            ? 'bg-sidebar-item-active text-sidebar-text-active'
            : 'text-sidebar-text hover:bg-sidebar-item-hover hover:text-white/90'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId={collapsed ? 'activeTabCollapsed' : 'activeTab'}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 w-[3px] rounded-full bg-sidebar-accent',
                isRtl ? 'right-0' : 'left-0'
              )}
              style={{ height: '20px' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
            />
          )}
          <item.icon className={cn(
            'h-[18px] w-[18px] shrink-0 transition-all duration-150',
            isActive ? 'text-sidebar-icon-active' : 'text-sidebar-icon group-hover:text-white/70'
          )} />
          {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
        </>
      )}
    </NavLink>
  );
}

export const Sidebar = memo(function Sidebar({ collapsed, onToggle, mobile, onMobileClose }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRtl = i18n.dir() === 'rtl';

  const width = mobile ? 260 : collapsed ? 72 : 240;

  return (
    <motion.aside
      animate={{ width }}
      transition={{ duration: 0.25, type: 'spring', bounce: 0, damping: 22 }}
      className={cn(
        'relative flex h-screen shrink-0 flex-col bg-sidebar-bg',
        !mobile && 'sticky top-0',
        mobile && 'fixed inset-y-0 start-0 z-50 shadow-2xl'
      )}
    >
      {/* Toggle button */}
      {!mobile && (
        <button
          onClick={onToggle}
          title={collapsed ? t('nav.expand') : t('nav.collapse')}
          className="absolute -end-3 top-[22px] z-50 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white text-primary shadow-sm transition-all hover:border-sidebar-accent/50 hover:text-sidebar-accent hover:shadow-md focus:outline-none"
        >
          {collapsed
            ? isRtl ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
            : isRtl ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />
          }
        </button>
      )}

      <div className="flex h-full flex-col">
        {/* Logo header */}
        <div className={cn(
          'flex shrink-0 items-center border-b border-sidebar-border transition-all duration-300',
          collapsed ? 'h-16 justify-center px-1' : 'h-16 gap-3 px-4'
        )}>
          <div className={cn(
            'flex shrink-0 items-center justify-center rounded-lg bg-white p-1 transition-all duration-300',
            collapsed ? 'h-9 w-9' : 'h-9 w-9'
          )}>
            <img
              src="/logo.png"
              alt={branding.name}
              className="h-full w-full object-contain"
            />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white tracking-tight">{branding.shortName}</p>
              <p className="truncate text-[11px] font-medium text-white/50">{branding.tagline}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 custom-scrollbar">
          {navGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
              {group.labelKey && !collapsed && (
                <div className="px-5 pb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-heading">
                    {t(group.labelKey)}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={item.to}
                    item={item}
                    collapsed={collapsed}
                    onMobileClose={onMobileClose}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="shrink-0 border-t border-sidebar-footer-border px-3 py-3">
          <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-2.5 px-1')}>
            <div
              title={collapsed ? (user?.displayName ?? '') : undefined}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold text-white transition-transform hover:scale-105"
            >
              {getInitials(user?.displayName ?? 'SA')}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/90">{user?.displayName}</p>
                <p className="truncate text-xs text-white/50">{user?.roleName}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
});
