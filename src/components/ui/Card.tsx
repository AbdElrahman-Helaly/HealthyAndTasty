import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glass?: boolean;
}

const paddingMap = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-7',
};

export function Card({ padding = 'md', hover = false, glass = true, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        glass ? 'card-premium' : 'bg-white rounded-xl border border-outline-variant/30 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)]',
        'rounded-2xl',
        hover && 'transition-all duration-200 hover:-translate-y-0.5',
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
    <h3 className={cn('text-[15px] font-semibold text-on-surface tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-on-surface-variant/70 mt-0.5', className)} {...props}>
      {children}
    </p>
  );
}

// ===== Mini Sparkline =====
function MiniSparkline({ data, color = '#7C3AED' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 72;
  const height = 32;
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
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${polyline} ${width},${height}`} fill={`url(#sparkGrad-${color.replace('#', '')})`} />
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={polyline} opacity="0.8" />
      <circle cx={points[points.length - 1].split(',')[0]} cy={points[points.length - 1].split(',')[1]} r="2.5" fill={color} stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

// ===== Stat Card =====
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
  index?: number;
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
  index = 0,
}: StatCardProps) {
  const sparkColor = alert ? '#DC2626' : iconColor;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: 'easeOut' }}
    >
      <Card padding="md" hover glass className={cn(
        'relative overflow-hidden group',
        alert && '!border-red-300 !bg-red-50/40'
      )}>
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: `linear-gradient(135deg, ${iconColor}03, transparent 60%)` }} />

        <div className="relative">
          <div className="flex items-start justify-between gap-2">
            <div
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110"
              style={{ background: `linear-gradient(135deg, ${iconColor}15, ${iconColor}08)`, color: iconColor }}
            >
              {icon}
            </div>

            {sparklineData && sparklineData.length >= 2 && (
              <div className="w-[72px] shrink-0 -mt-1 -me-1 opacity-60 group-hover:opacity-90 transition-opacity">
                <MiniSparkline data={sparklineData} color={sparkColor} />
              </div>
            )}
          </div>

          <p className="mt-3 text-xs font-medium text-on-surface-variant/70 leading-relaxed tracking-wide">{label}</p>

          <p className={cn(
            'mt-1 text-[26px] font-bold tabular-nums tracking-tight leading-none',
            alert ? 'text-red-700' : 'text-on-surface'
          )}>
            {value}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            {trend && (
              <span className={cn(
                'inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md',
                trend.direction === 'up' && 'bg-green-50 text-success',
                trend.direction === 'down' && 'bg-red-50 text-error',
                trend.direction === 'neutral' && 'bg-gray-50 text-on-surface-variant'
              )}>
                {trend.direction === 'up' && <TrendingUp className="h-3 w-3" />}
                {trend.direction === 'down' && <TrendingDown className="h-3 w-3" />}
                {trend.direction === 'neutral' && <Minus className="h-3 w-3" />}
                {trend.value}
              </span>
            )}
            {comparisonText && (
              <span className="text-[10px] text-on-surface-variant/50">{comparisonText}</span>
            )}
            {alert && (
              <span className="me-auto text-[10px] font-semibold text-red-600 flex items-center gap-0.5">
                <Info className="h-3 w-3" />
                يحتاج متابعة
              </span>
            )}
          </div>
        </div>

        {hoverDetail && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out bg-primary/90 backdrop-blur-sm px-4 py-2.5 text-xs text-white rounded-b-2xl">
            {hoverDetail}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card-premium rounded-2xl p-5 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-[42px] w-[42px] rounded-2xl skeleton" />
        <div className="h-8 w-[72px] rounded skeleton" />
      </div>
      <div className="mt-3 h-3 w-24 rounded skeleton" />
      <div className="mt-1.5 h-8 w-20 rounded skeleton" />
      <div className="mt-2.5 h-5 w-28 rounded skeleton" />
    </div>
  );
}
