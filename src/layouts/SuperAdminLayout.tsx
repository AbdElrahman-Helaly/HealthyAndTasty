import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { useSidebar } from '@/hooks/useSidebar';
import { useNotifications } from '@/hooks/useNotifications';
import { useMemo } from 'react';

export function SuperAdminLayout() {
  const { collapsed, toggle, mobileOpen, openMobile, closeMobile } = useSidebar();
  const { data: notifications } = useNotifications();

  const unreadCount = useMemo(
    () => (notifications ?? []).filter((n) => !n.isRead).length,
    [notifications],
  );

  return (
    // h-screen مع overflow-hidden هنا تمنع الصفحة كاملة من الـ Scroll لخارج الشاشة
    <div className="flex h-screen w-screen overflow-hidden bg-background">

      {/* السايد بار أصبح ثابتاً في مكانه تماماً بفضل محاذاة الهيكل */}
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={closeMobile}
            />
            <Sidebar collapsed={false} onToggle={toggle} mobile onMobileClose={closeMobile} />
          </>
        )}
      </AnimatePresence>

      {/* الجزء الأيمن بالكامل يأخذ الارتفاع الكامل ويمنع التسريب البصري */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <TopNav onMenuClick={openMobile} unreadCount={unreadCount} />

        {/* الـ main هنا هو الوحيد المسموح له بعمل scroll للمحتوى بداخل الصفحات */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}