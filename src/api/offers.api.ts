import { http } from '@/lib/apiClient';
import type { CreateOfferRequest, Offer, UpdateOfferRequest } from '@/types';

/** GET /api/admin/offers?activeOnly=<optional> — Admin only */
export function listOffers(activeOnly?: boolean): Promise<Offer[]> {
  const params = typeof activeOnly === 'boolean' ? { activeOnly } : undefined;
  return http.get<Offer[]>('/api/admin/offers', { params });
}

/** GET /api/admin/offers/{id} */
export function getOffer(id: string | number): Promise<Offer> {
  return http.get<Offer>(`/api/admin/offers/${encodeURIComponent(String(id))}`);
}

/** POST /api/admin/offers — Admin only */
export function createOffer(body: CreateOfferRequest): Promise<Offer> {
  return http.post<Offer>('/api/admin/offers', body);
}

/** PUT /api/admin/offers/{id} — all fields optional */
export function updateOffer(
  id: string | number,
  body: UpdateOfferRequest,
): Promise<Offer> {
  return http.put<Offer>(`/api/admin/offers/${encodeURIComponent(String(id))}`, body);
}

/** DELETE /api/admin/offers/{id} */
export function deleteOffer(id: string | number): Promise<boolean> {
  return http.delete<boolean>(`/api/admin/offers/${encodeURIComponent(String(id))}`);
}

/** PATCH /api/admin/offers/{id}/toggle */
export function toggleOffer(id: string | number): Promise<Offer> {
  return http.patch<Offer>(`/api/admin/offers/${encodeURIComponent(String(id))}/toggle`);
}
