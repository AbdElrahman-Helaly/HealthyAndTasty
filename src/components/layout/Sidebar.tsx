import { memo, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ShoppingCart,
  Radio,
  Users,
  Shield,
  Building2,
  BarChart3,
  PieChart,
  BellRing,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Truck,
  Tag,
  LayoutGrid,
  Package,
} from 'lucide-react';
import { branding } from '@/config/branding';
import { cn, getInitials } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { usePermissionContext } from '@/context/PermissionContext';
import { PERMISSIONS } from '@/types/permissions';

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
  /** Menu item is visible only when the user holds this permission */
  permission?: string;
  /** Menu item is visible only when the user holds ANY of these roles (case-insensitive contains) */
  roles?: string[];
}

interface NavGroup {
  labelKey?: string;
  items: NavItem[];
}

interface ModuleStyle {
  gradient: string;
  shadow: string;
  color: string;
}

const moduleStyles: Record<string, ModuleStyle> = {
  '/dashboard': { gradient: 'linear-gradient(135deg, #8B5CF6, #6D4CFF)', shadow: 'rgba(109,76,255,0.35)', color: '#7C3AED' },
  '/orders': { gradient: 'linear-gradient(135deg, #38BDF8, #2563EB)', shadow: 'rgba(37,99,235,0.35)', color: '#3B82F6' },
  '/live-orders': { gradient: 'linear-gradient(135deg, #34D399, #059669)', shadow: 'rgba(5,150,105,0.35)', color: '#10B981' },
  '/employees': { gradient: 'linear-gradient(135deg, #22D3EE, #0891B2)', shadow: 'rgba(8,145,178,0.35)', color: '#06B6D4' },
  '/roles': { gradient: 'linear-gradient(135deg, #818CF8, #4F46E5)', shadow: 'rgba(79,70,229,0.35)', color: '#6366F1' },
  '/branches': { gradient: 'linear-gradient(135deg, #FBBF24, #EA580C)', shadow: 'rgba(234,88,12,0.35)', color: '#F59E0B' },
  '/reports': { gradient: 'linear-gradient(135deg, #60A5FA, #2563EB)', shadow: 'rgba(37,99,235,0.35)', color: '#3B82F6' },
  '/statistics': { gradient: 'linear-gradient(135deg, #A78BFA, #4338CA)', shadow: 'rgba(67,56,202,0.35)', color: '#6366F1' },
  '/notifications': { gradient: 'linear-gradient(135deg, #FDE047, #EAB308)', shadow: 'rgba(234,179,8,0.35)', color: '#FACC15' },
  '/shipping-rates': { gradient: 'linear-gradient(135deg, #2DD4BF, #0F766E)', shadow: 'rgba(13,148,136,0.35)', color: '#14B8A6' },
  '/offers': { gradient: 'linear-gradient(135deg, #F472B6, #BE185D)', shadow: 'rgba(190,24,93,0.35)', color: '#DB2777' },
  '/categories': { gradient: 'linear-gradient(135deg, #A78BFA, #6D28D9)', shadow: 'rgba(109,40,217,0.35)', color: '#8B5CF6' },
  '/inventory': { gradient: 'linear-gradient(135deg, #34D399, #0D9488)', shadow: 'rgba(13,148,136,0.35)', color: '#10B981' },
  '/profile': { gradient: 'linear-gradient(135deg, #94A3B8, #475569)', shadow: 'rgba(71,85,105,0.35)', color: '#64748B' },
};

function getModuleStyle(path: string): ModuleStyle {
  return moduleStyles[path] ?? moduleStyles['/profile'];
}

function filterNavGroups(
  groups: NavGroup[],
  permissions: string[],
  role: string,
): NavGroup[] {
  const normalizedRole = role.toLowerCase();
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        if (normalizedRole === 'branchemployee') return ['/orders', '/inventory'].includes(item.to);
        if (item.permission && !permissions.includes(item.permission)) return false;
        if (item.roles && !item.roles.some((r) => normalizedRole.includes(r))) return false;
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);
}

const navGroups: NavGroup[] = [
  {
    items: [
      { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard', permission: PERMISSIONS.DashboardView },
    ],
  },
  {
    labelKey: 'nav.sectionOrders',
    items: [
      { to: '/orders', icon: ShoppingCart, labelKey: 'nav.orders', permission: PERMISSIONS.OrdersView },
      { to: '/live-orders', icon: Radio, labelKey: 'nav.liveOrders', permission: PERMISSIONS.OrdersView },
    ],
  },
  {
    labelKey: 'nav.sectionManagement',
    items: [
      { to: '/employees', icon: Users, labelKey: 'nav.employees', permission: PERMISSIONS.EmployeesView },
      { to: '/roles', icon: Shield, labelKey: 'nav.roles', permission: PERMISSIONS.RolesView },
      { to: '/branches', icon: Building2, labelKey: 'nav.branches', permission: PERMISSIONS.BranchesView },
      {
        to: '/shipping-rates',
        icon: Truck,
        labelKey: 'nav.shippingRates',
        roles: ['admin', 'generalmanager', 'branchmanager'],
      },
      {
        to: '/offers',
        icon: Tag,
        labelKey: 'nav.offers',
        roles: ['admin'],
      },
      {
        to: '/categories',
        icon: LayoutGrid,
        labelKey: 'nav.categories',
        roles: ['admin', 'generalmanager'],
      },
      { to: '/inventory', icon: Package, labelKey: 'nav.inventory', permission: PERMISSIONS.DashboardView },
    ],
  },
  {
    labelKey: 'nav.sectionReports',
    items: [
      { to: '/reports', icon: BarChart3, labelKey: 'nav.reports', permission: PERMISSIONS.ReportsView },
      { to: '/statistics', icon: PieChart, labelKey: 'nav.statistics', permission: PERMISSIONS.ReportsView },
    ],
  },
  {
    labelKey: 'nav.sectionMarketing',
    items: [
      { to: '/banners', icon: LayoutGrid, labelKey: 'nav.banners', roles: ['admin', 'generalmanager'] },
      { to: '/notifications', icon: BellRing, labelKey: 'nav.notifications', permission: PERMISSIONS.NotificationsSend },
    ],
  },
  {
    labelKey: 'nav.sectionSystem',
    items: [
      { to: '/settings/order-delivery-time', icon: Truck, labelKey: 'nav.orderDeliveryTime', roles: ['admin', 'generalmanager'] },
      { to: '/settings/branch-hours', icon: Building2, labelKey: 'nav.branchHours' },
      { to: '/profile', icon: UserCircle, labelKey: 'nav.profile' },
    ],
  },
];

interface SidebarNavItemProps {
  item: NavItem;
  collapsed: boolean;
  onMobileClose?: () => void;
  isRtl: boolean;
}

function SidebarNavItem({ item, collapsed, onMobileClose, isRtl }: SidebarNavItemProps) {
  const { t } = useTranslation();
  const style = getModuleStyle(item.to);

  return (
    <NavLink
      to={item.to}
      onClick={onMobileClose}
      title={collapsed ? t(item.labelKey) : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-2xl transition-all duration-250 select-none',
          collapsed ? 'justify-center mx-3 py-3' : 'mx-3 py-2.5 px-3',
          isActive
            ? 'bg-gradient-to-r from-[#6D4CFF]/20 to-[#8B5CF6]/10 shadow-[0_0_20px_rgba(109,76,255,0.12)]'
            : 'hover:bg-white/[0.06]'
        )
      }
      style={{ minHeight: collapsed ? undefined : 52 }}
    >
      {({ isActive }) => (
        <>
          {/* Active left glow indicator */}
          {isActive && (
            <motion.span
              layoutId={`activeTab-${collapsed ? 'collapsed' : 'expanded'}`}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 w-[5px] rounded-full bg-[#6D4CFF] shadow-[0_0_10px_rgba(109,76,255,0.6)]',
                isRtl ? 'right-0.5' : 'left-0.5'
              )}
              style={{ height: 28 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            />
          )}

          {/* Icon container */}
          <motion.div
            whileHover={collapsed ? undefined : { scale: 1.08, rotate: 3 }}
            transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            className={cn(
              'flex shrink-0 items-center justify-center rounded-2xl transition-shadow duration-250',
              collapsed ? 'h-10 w-10' : 'h-10 w-10',
              isActive && 'shadow-lg'
            )}
            style={{
              background: style.gradient,
              boxShadow: isActive ? `0 4px 14px ${style.shadow}` : 'none',
            }}
          >
            <item.icon className="h-5 w-5 text-white" strokeWidth={2.2} />
          </motion.div>

          {/* Label */}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <span className={cn(
                'block text-sm font-medium transition-colors duration-200',
                isActive ? 'text-white font-semibold' : 'text-white/60 group-hover:text-white/80'
              )}>
                {t(item.labelKey)}
              </span>
            </div>
          )}

          {/* Active dot indicator for expanded mode */}
          {isActive && !collapsed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: style.color }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}

export const Sidebar = memo(function Sidebar({ collapsed, onToggle, mobile, onMobileClose }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { permissions } = usePermissionContext();
  const isRtl = i18n.dir() === 'rtl';
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!navRef.current) return;
    const active = navRef.current.querySelector('[class*="bg-gradient-to-r"]');
    if (active) {
      active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [location.pathname]);

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.35, type: 'spring', bounce: 0, damping: 26 }}
      className={cn(
        'relative flex h-screen shrink-0 flex-col',
        'bg-gradient-to-b from-[#1E1B4B] via-[#231F5E] to-[#1E1B4B]',
        'backdrop-blur-2xl',
        'border-s border-white/[0.06]',
        !mobile && 'sticky top-0 z-20',
        mobile && 'fixed inset-y-0 start-0 z-50',
        collapsed ? 'rounded-none' : 'rounded-none lg:rounded-none'
      )}
      style={{ boxShadow: '4px 0 40px rgba(0,0,0,0.2), inset -1px 0 0 rgba(255,255,255,0.04)' }}
    >
      {/* Toggle button */}
      {!mobile && (
        <button
          onClick={onToggle}
          title={collapsed ? t('nav.expand') : t('nav.collapse')}
          className="absolute -end-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-[#312E81] text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all hover:scale-110 hover:shadow-[0_4px_14px_rgba(109,76,255,0.3)] focus:outline-none border border-white/[0.08]"
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
          'shrink-0 transition-all duration-300 border-b border-white/[0.06]',
          collapsed ? 'flex h-16 items-center justify-center' : 'flex flex-col items-start pt-6 pb-5 px-6'
        )}>
          <div className={cn(
            'flex shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300',
            collapsed ? 'h-10 w-10 p-[5px]' : 'h-[52px] w-[52px] p-[6px]'
          )}>
            <img src="/logo.png" alt={branding.name} className="h-full w-full object-contain" />
          </div>
          {!collapsed && (
            <div className="mt-3 w-full">
              <div className="flex items-center gap-2.5">
                <p className="text-base font-bold text-white tracking-tight">{branding.name}</p>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[9px] font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                  Online
                </span>
              </div>
              <p className="text-[10px] font-medium text-white/35 mt-1 tracking-wider uppercase">Super Admin Portal</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav ref={navRef} className="flex-1 overflow-y-auto py-5 custom-scrollbar" style={{ scrollBehavior: 'smooth' }}>
          {filterNavGroups(navGroups, permissions, user?.role ?? '').map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-6' : ''}>
              {group.labelKey && !collapsed && (
                <div className="px-6 pb-2.5">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">
                    {t(group.labelKey)}
                  </span>
                </div>
              )}
              {collapsed && group.labelKey && (
                <div className="flex justify-center pb-2">
                  <span className="h-px w-6 bg-white/[0.06]" />
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={item.to}
                    item={item}
                    collapsed={collapsed}
                    onMobileClose={onMobileClose}
                    isRtl={isRtl}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User card footer */}
        <div className={cn(
          'shrink-0 mx-3 mb-4',
          collapsed ? 'px-0' : 'px-1'
        )}>
          <div className={cn(
            'rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] transition-all',
            collapsed ? 'p-2' : 'p-3'
          )}>
            <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
              {/* Avatar with gradient border */}
              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6D4CFF] text-sm font-bold text-white shadow-lg">
                  {getInitials(user?.name ?? 'SA')}
                </div>
                <span className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-[#1E1B4B] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-white/90">{user?.name ?? 'Admin'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="truncate text-[10px] font-medium text-white/40">{user?.role ?? 'Super Admin'}</span>
                    <span className="text-white/20">·</span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400/70">
                      <Sparkles className="h-2.5 w-2.5" />
                      Active
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Logout button - only in expanded */}
            {!collapsed && (
              <button
                onClick={() => void logout()}
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[11px] font-medium text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t('common.logout')}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
});
