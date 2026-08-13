import { http } from '@/lib/apiClient';
import type {
  CreateShippingRateRequest,
  ShippingRate,
  UpdateShippingRateRequest,
} from '@/types';

/** GET /api/admin/shipping-rates?branchId=<optional> — Admin/GeneralManager/BranchManager */
export function listShippingRates(branchId?: string): Promise<ShippingRate[]> {
  const params = branchId ? { branchId } : undefined;
  return http.get<ShippingRate[]>('/api/admin/shipping-rates', { params });
}

/** POST /api/admin/shipping-rates — Admin/GeneralManager only */
export function createShippingRate(body: CreateShippingRateRequest): Promise<ShippingRate> {
  return http.post<ShippingRate>('/api/admin/shipping-rates', body);
}

/** PUT /api/admin/shipping-rates/{id} — all fields optional */
export function updateShippingRate(
  id: string,
  body: UpdateShippingRateRequest,
): Promise<ShippingRate> {
  return http.put<ShippingRate>(`/api/admin/shipping-rates/${encodeURIComponent(id)}`, body);
}

/** DELETE /api/admin/shipping-rates/{id} */
export function deleteShippingRate(id: string): Promise<boolean> {
  return http.delete<boolean>(`/api/admin/shipping-rates/${encodeURIComponent(id)}`);
}