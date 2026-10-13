import type { OrderStatusNumber } from '@/types';

export interface OrderStatusConfig {
  label: string;
  className: string;
  color: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatusNumber, OrderStatusConfig> = {
  1: { label: 'قيد الانتظار', className: 'badge badge-warning', color: '#F59E0B' },
  2: { label: 'مؤكد', className: 'badge badge-info', color: '#3B82F6' },
  3: { label: 'فشل المزامنة', className: 'badge badge-neutral', color: '#94A3B8' },
  4: { label: 'ملغي', className: 'badge badge-danger', color: '#EF4444' },
  5: { label: 'مكتمل', className: 'badge badge-success', color: '#14B8A6' },
  6: { label: 'قيد التحضير', className: 'badge badge-indigo', color: '#6366F1' },
  7: { label: 'جاهز للتوصيل', className: 'badge badge-purple', color: '#8B5CF6' },
  8: { label: 'خارج للتوصيل', className: 'badge badge-cyan', color: '#0EA5E9' },
  9: { label: 'تم التوصيل', className: 'badge badge-success', color: '#22C55E' },
  10: { label: 'مرفوض', className: 'badge badge-danger', color: '#F43F5E' },
};

export function orderStatusConfig(status: OrderStatusNumber): OrderStatusConfig {
  return ORDER_STATUS_CONFIG[status] ?? ORDER_STATUS_CONFIG[1];
}

export function formatCurrency(n: number): string {
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} ج.م`;
}
