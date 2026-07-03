import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingMap = {
  none: '',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ padding = 'md', hover = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded-xl border border-outline-variant/30 shadow-card',
        hover && 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
        paddingMap[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-semibold text-on-surface', className)} {...props}>
      {children}
    </h3>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconBg?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  sparklineData?: number[];
}

function MiniSparkline({ data = [0], color = '#40296e' }: { data?: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 28;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  const polyline = points.join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polyline}
        opacity="0.6"
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polyline}
        opacity="0.15"
      />
    </svg>
  );
}

export function StatCard({ label, value, icon, iconBg = 'bg-primary-surface text-primary', trend, sparklineData }: StatCardProps) {
  return (
    <Card padding="sm" hover>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconBg)}>
              {icon}
            </div>
            <span className="text-xs font-medium text-on-surface-variant truncate">{label}</span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold tabular-nums text-on-surface">{value}</span>
            {trend && (
              <span className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium',
                trend.direction === 'up' && 'text-success',
                trend.direction === 'down' && 'text-error',
                trend.direction === 'neutral' && 'text-on-surface-variant'
              )}>
                {trend.direction === 'up' && <TrendingUp className="h-3 w-3" />}
                {trend.direction === 'down' && <TrendingDown className="h-3 w-3" />}
                {trend.direction === 'neutral' && <Minus className="h-3 w-3" />}
                {trend.value}
              </span>
            )}
          </div>
        </div>
        {sparklineData && sparklineData.length >= 2 && (
          <div className="w-16 shrink-0 self-start mt-1 opacity-60">
            <MiniSparkline data={sparklineData} />
          </div>
        )}
      </div>
    </Card>
  );
}
