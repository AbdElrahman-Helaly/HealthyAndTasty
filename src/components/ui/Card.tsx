import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ padding = 'md', hover = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-outline-variant/30 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)]',
        hover && 'transition-all duration-200 hover:shadow-[0_8px_16px_rgba(45,27,105,0.08)] hover:-translate-y-0.5',
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
    <div className={cn('flex items-center justify-between mb-3', className)} {...props}>
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

function MiniSparkline({ data, color = '#7C3AED' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 64;
  const height = 28;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  const polyline = points.join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height, minWidth: width }}>
      <defs>
        <linearGradient id={`sparkGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${polyline} ${width},${height}`}
        fill={`url(#sparkGrad-${color.replace('#', '')})`}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polyline}
        opacity="0.7"
      />
      <circle cx={points[points.length - 1].split(',')[0]} cy={points[points.length - 1].split(',')[1]} r="2" fill={color} />
    </svg>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  comparisonText?: string;
  sparklineData?: number[];
  alert?: boolean;
  hoverDetail?: string;
}

export function StatCard({
  label,
  value,
  icon,
  iconColor = '#7C3AED',
  trend,
  comparisonText,
  sparklineData,
  alert = false,
  hoverDetail,
}: StatCardProps) {
  const sparkColor = alert ? '#DC2626' : iconColor;

  return (
    <Card padding="sm" hover className={cn(
      'relative overflow-hidden group',
      alert && 'border-red-300 bg-red-50/40 shadow-[0_0_0_1px_rgba(220,38,38,0.15)]'
    )}>
      <div className="flex items-start justify-between gap-2">
        {/* Icon circle */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${iconColor}18`, color: iconColor }}
        >
          {icon}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length >= 2 && (
          <div className="w-16 shrink-0 -mt-1 -me-1 opacity-70">
            <MiniSparkline data={sparklineData} color={sparkColor} />
          </div>
        )}
      </div>

      {/* Label */}
      <p className="mt-2 text-xs font-medium text-on-surface-variant/80 leading-relaxed">{label}</p>

      {/* Value */}
      <p className={cn(
        'mt-0.5 text-2xl font-bold tabular-nums tracking-tight',
        alert ? 'text-red-700' : 'text-on-surface'
      )}>
        {value}
      </p>

      {/* Trend row */}
      <div className="mt-1.5 flex items-center gap-1.5">
        {trend && (
          <span className={cn(
            'inline-flex items-center gap-0.5 text-xs font-semibold',
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
        {comparisonText && (
          <span className="text-[10px] text-on-surface-variant/60">{comparisonText}</span>
        )}
        {alert && (
          <span className="me-auto text-[10px] font-semibold text-red-600 flex items-center gap-0.5">
            <Info className="h-3 w-3" />
            يحتاج متابعة
          </span>
        )}
      </div>

      {/* Hover detail */}
      {hoverDetail && (
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out bg-primary/90 backdrop-blur-sm px-4 py-2.5 text-xs text-white rounded-b-xl">
          {hoverDetail}
        </div>
      )}
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-outline-variant/30 p-4 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-10 w-10 rounded-full skeleton" />
        <div className="h-7 w-16 rounded skeleton" />
      </div>
      <div className="mt-3 h-3 w-24 rounded skeleton" />
      <div className="mt-1.5 h-7 w-16 rounded skeleton" />
      <div className="mt-2 h-3 w-32 rounded skeleton" />
    </div>
  );
}
