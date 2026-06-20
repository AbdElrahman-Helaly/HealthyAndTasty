import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type ReactNode, useEffect, useRef } from 'react';
import { Button } from './Button';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !modalRef.current) return;
    const previousActiveElement = document.activeElement as HTMLElement;
    const focusableSelectors =
      'a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]';
    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(focusableSelectors);
    if (focusableElements.length > 0) focusableElements[0].focus();
    return () => previousActiveElement?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className={cn(
              'relative z-10 w-full rounded-2xl bg-surface p-6 shadow-xl',
              sizeMap[size],
            )}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  loading,
  cancelText,
  confirmText,
  variant = 'danger',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  loading?: boolean;
  cancelText?: string;
  confirmText?: string;
  variant?: 'danger' | 'primary';
}) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="mb-6 text-sm text-on-surface-variant">{message}</div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          {cancelText || t('common.cancel')}
        </Button>
        <Button
          variant={variant}
          loading={loading}
          onClick={onConfirm}
          aria-label={variant === 'danger' ? 'Confirm destructive action' : undefined}
        >
          {confirmText || t('common.confirm')}
        </Button>
      </div>
    </Modal>
  );
}
