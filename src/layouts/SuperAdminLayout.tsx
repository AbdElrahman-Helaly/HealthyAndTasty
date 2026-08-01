import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { useSidebar } from '@/hooks/useSidebar';

export function SuperAdminLayout() {
  const { collapsed, toggle, mobileOpen, openMobile, closeMobile } = useSidebar();

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-noise">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -start-40 w-[600px] h-[500px] bg-blob-purple mix-blend-multiply" />
        <div className="absolute -bottom-40 -end-40 w-[500px] h-[400px] bg-blob-blue mix-blend-multiply" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blob-pink mix-blend-multiply" />
        <div className="absolute inset-0 bg-noise" />
      </div>

      {/* Base gradient */}
      <div className="fixed inset-0" style={{ background: 'linear-gradient(160deg, #F8F9FF 0%, #F0EDFF 30%, #F4F0FF 60%, #F8F9FF 100%)' }} />

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

      <div className="relative flex flex-1 flex-col min-w-0 h-full overflow-hidden z-10">
        <TopNav onMenuClick={openMobile} />

        <main className="flex-1 overflow-y-auto p-5 md:p-6 lg:p-7 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
