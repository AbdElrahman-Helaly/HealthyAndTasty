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
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={closeMobile}
            />
            <Sidebar collapsed={false} onToggle={toggle} mobile onMobileClose={closeMobile} />
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <TopNav onMenuClick={openMobile} unreadCount={unreadCount} />

        <main className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar">
          <div className="mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
