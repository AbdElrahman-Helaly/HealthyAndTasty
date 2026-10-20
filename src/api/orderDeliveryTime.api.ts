import { http } from '@/lib/apiClient';

export type DeliveryTimeUnit = 'minutes' | 'hours' | 'days';
export interface OrderDeliveryTime {
  branchId: number;
  branchName: string;
  value: number | null;
  unit: DeliveryTimeUnit | null;
}
export type SaveDeliveryTimeRequest = { value: number; unit: DeliveryTimeUnit } & (
  { allBranches: true } | { allBranches: false; branchId: number }
);
export const deliveryUnitLabels: Record<DeliveryTimeUnit, string> = { minutes: 'دقيقة', hours: 'ساعة', days: 'يوم' };
export function listOrderDeliveryTimes(): Promise<OrderDeliveryTime[]> {
  return http.get('/api/admin/order-delivery-time');
}
export function saveOrderDeliveryTime(body: SaveDeliveryTimeRequest): Promise<unknown> {
  return http.put('/api/admin/order-delivery-time', body);
}
