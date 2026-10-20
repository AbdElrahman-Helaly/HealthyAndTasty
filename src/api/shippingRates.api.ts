import { http } from '@/lib/apiClient';

export interface FreeShippingSetting {
  branchId: string;
  odooBranchId: number;
  branchName: string;
  isFreeShipping: boolean;
}
export type FreeShippingRequest = { isFreeShipping: boolean } & (
  { allBranches: true } | { allBranches: false; branchIds: string[] }
);
export function listFreeShipping(): Promise<FreeShippingSetting[]> {
  return http.get('/api/admin/shipping-rates/free-shipping');
}
export function saveFreeShipping(body: FreeShippingRequest): Promise<unknown> {
  return http.put('/api/admin/shipping-rates/free-shipping', body);
}

export type BulkShippingRatesRequest = {
  bands: { minDistanceKm: number; maxDistanceKm: number; fee: number }[];
} & ({ allBranches: true } | { allBranches: false; branchIds: string[] });

export function createBulkShippingRates(body: BulkShippingRatesRequest): Promise<unknown> {
  return http.post('/api/admin/shipping-rates/bulk', body);
}
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
