import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent' | 'neutral' | 'inactive';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-primary-surface text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
  accent: 'bg-accent/10 text-accent-dark',
  neutral: 'bg-on-surface/10 text-on-surface-variant',
  inactive: 'bg-on-surface/10 text-on-surface-variant',
};

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  const { t } = useTranslation();
  return (
    <Badge variant={active ? 'success' : 'inactive'}>
      {active ? t('common.active') : t('common.inactive')}
    </Badge>
  );
}

