import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Toast } from '@/hooks/useToast';

const variants = {
  success: {
    container: 'bg-success/10 border-success/30 text-success',
    icon: CheckCircle,
  },
  error: {
    container: 'bg-error/10 border-error/30 text-error',
    icon: AlertCircle,
  },
  info: {
    container: 'bg-primary/10 border-primary/30 text-primary',
    icon: Info,
  },
} as const;

interface ToastListProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export function ToastList({ toasts, onDismiss }: ToastListProps) {
  return (
    <div className="fixed bottom-5 end-5 z-[100] flex flex-col gap-2 w-80">
      <AnimatePresence>
        {toasts.map((t) => {
          const { container, icon: Icon } = variants[t.variant];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                'flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium',
                container,
              )}
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => onDismiss(t.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
