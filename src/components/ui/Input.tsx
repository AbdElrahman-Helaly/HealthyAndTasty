import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-[58px] w-full rounded-2xl border bg-gray-50 px-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500',
              icon ? 'ps-10' : '',
              error
                ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-300 hover:border-purple-400',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
