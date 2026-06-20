import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface FormDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function FormDrawer({ open, onClose, title, children, footer }: FormDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/40 px-6 py-4">
              <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <div className="border-t border-outline-variant/40 px-6 py-4">{footer}</div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
