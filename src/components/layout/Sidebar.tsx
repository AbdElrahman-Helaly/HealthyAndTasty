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
  Bell,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Image,
  Tag,
} from 'lucide-react';
import { branding } from '@/config/branding';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
  onMobileClose?: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' as const },
  { to: '/countries', icon: Globe, labelKey: 'nav.countries' as const },
  { to: '/categories', icon: FolderTree, labelKey: 'nav.categories' as const },
  { to: '/branches', icon: Building2, labelKey: 'nav.branches' as const },
  { to: '/employees', icon: Users, labelKey: 'nav.employees' as const },
  { to: '/products', icon: Package, labelKey: 'nav.products' as const },
  { to: '/addresses', icon: MapPin, labelKey: 'nav.addresses' as const },
  { to: '/banners', icon: Image, labelKey: 'nav.banners' as const },
  { to: '/discounts', icon: Tag, labelKey: 'nav.discounts' as const },
  { to: '/notifications', icon: Bell, labelKey: 'nav.notifications' as const },
  { to: '/audit-logs', icon: ScrollText, labelKey: 'nav.auditLogs' as const },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' as const },
];

export const Sidebar = memo(function Sidebar({ collapsed, onToggle, mobile, onMobileClose }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRtl = i18n.dir() === 'rtl';

  const width = mobile ? 260 : collapsed ? 80 : 260;

  return (
    <motion.aside
      animate={{ width }}
      transition={{ duration: 0.3, type: 'spring', bounce: 0, damping: 20 }}
      className={cn(
        // 🌟 تعديل: شلنا overflow-hidden ورفعنا الـ z-index لـ z-50 عشان الزرار يظهر كامل وفوق كل الصفحات
        'gradient-primary relative flex h-screen shrink-0 flex-col z-50 sticky top-0',
        !mobile && 'shadow-[4px_0_24px_rgba(0,0,0,0.05)]',
        mobile && 'fixed inset-y-0 start-0 z-50 w-[260px] shadow-2xl'
      )}
    >
      {/* طبقة شفافة لتخفيف حدة الألوان الأصلية وجعلها مريحة للعين */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      {/* زر الفتح والقفل العائم - الآن سيظهر كاملاً فوق أي محتوى جانبي */}
      {!mobile && (
        <button
          onClick={onToggle}
          title={collapsed ? t('nav.expand') : t('nav.collapse')}
          className="absolute -end-4 top-8 z-[60] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-md ring-4 ring-white/10 transition-all hover:scale-110 hover:shadow-lg focus:outline-none"
        >
          {collapsed
            ? isRtl ? <ChevronLeft className="h-4 w-4 stroke-[2.5]" /> : <ChevronRight className="h-4 w-4 stroke-[2.5]" />
            : isRtl ? <ChevronRight className="h-4 w-4 stroke-[2.5]" /> : <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
          }
        </button>
      )}

      {/* المحتوى الداخلي للسايد بار (هنا الـ overflow-hidden الصح عشان يحمي القائمة بس) */}
      <div className="relative z-10 flex h-full flex-col overflow-hidden">

        {/* Header */}
        <div className={cn(
          "flex h-24 items-center shrink-0 px-5 transition-all duration-300",
          collapsed ? "justify-center px-0" : "gap-4"
        )}>
          {/* إطار أبيض أنيق للوجو لضمان وضوحه */}
          <div className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm transition-all duration-300",
            collapsed ? "h-11 w-11" : "h-12 w-12"
          )}>
            <img
              src="/logo.png"
              alt={branding.name}
              className="h-full w-full object-contain"
            />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1 animate-in fade-in duration-500">
              <p className="truncate text-base font-bold text-white tracking-wide">{branding.name}</p>
              <p className="truncate text-xs font-medium text-white/70">{branding.tagline}</p>
            </div>
          )}
        </div>

        <div className="mx-4 mb-4 border-b border-white/10" />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-6 flex flex-col gap-1 custom-scrollbar">
          {navItems.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onMobileClose}
              title={collapsed ? t(labelKey) : undefined}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3.5 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ease-out',
                  collapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-white/20 text-white shadow-[0_2px_10px_rgba(0,0,0,0.1)] backdrop-blur-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1 rtl:hover:-translate-x-1'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !collapsed && (
                    <motion.span
                      layoutId="activeTab"
                      className="absolute inset-y-2 start-0 w-1 rounded-full bg-white drop-shadow-md"
                    />
                  )}
                  {isActive && collapsed && (
                    <motion.span
                      layoutId="activeTabCollapsed"
                      className="absolute inset-x-2 bottom-0 h-1 rounded-full bg-white drop-shadow-md"
                    />
                  )}

                  <Icon className={cn(
                    'h-5 w-5 shrink-0 transition-all duration-200',
                    isActive ? 'text-white scale-110 drop-shadow-md' : 'text-white/70 group-hover:text-white'
                  )} />

                  {!collapsed && <span className="truncate">{t(labelKey)}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 p-4 shrink-0 bg-black/10 backdrop-blur-sm">
          <div className={cn('flex items-center gap-3 transition-all', collapsed && 'justify-center')}>
            <div
              title={collapsed ? (user?.displayName ?? '') : undefined}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border-2 border-white/20 text-sm font-bold text-gray-800 shadow-sm transition-transform hover:scale-105"
            >
              {getInitials(user?.displayName ?? 'SA')}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user?.displayName}</p>
                <p className="truncate text-xs text-white/70 mt-0.5">{user?.roleName}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
});