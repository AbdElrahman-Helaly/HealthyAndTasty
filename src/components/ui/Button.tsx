import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'success' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'xl' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'gradient-primary text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.97]',
  secondary: 'bg-white border border-outline-variant/50 text-on-surface hover:bg-surface-container hover:border-outline-variant shadow-sm',
  ghost: 'text-on-surface-variant hover:bg-surface-container',
  danger: 'bg-error text-white hover:bg-red-600 shadow-md active:scale-[0.97]',
  accent: 'gradient-accent text-white shadow-md shadow-orange-200 active:scale-[0.97]',
  success: 'gradient-success text-white shadow-md shadow-green-200 active:scale-[0.97]',
  outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary-surface font-semibold',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-xl',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-12 px-6 text-sm rounded-2xl',
  xl: 'h-14 px-8 text-base rounded-2xl',
  icon: 'h-10 w-10 rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
