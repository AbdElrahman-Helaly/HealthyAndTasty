import { http } from '@/lib/apiClient';
import type { Offer } from '@/types';

/** GET /api/admin/offers?activeOnly=<optional> — Admin only */
export function listOffers(activeOnly?: boolean): Promise<Offer[]> {
  const params = typeof activeOnly === 'boolean' ? { activeOnly } : undefined;
  return http.get<Offer[]>('/api/admin/offers', { params });
}

/** GET /api/admin/offers/{id} */
export function getOffer(id: string | number): Promise<Offer> {
  return http.get<Offer>(`/api/admin/offers/${encodeURIComponent(String(id))}`);
}

const XHR_HEADERS = { 'Content-Type': 'multipart/form-data' };

function appendFormValue<T extends Record<string, unknown>>(
  fd: FormData,
  key: string,
  value: T[keyof T] | undefined | null,
): void {
  if (value === undefined || value === null || value === '') return;
  fd.append(key, String(value));
}

/** Build a multipart body for create/update from the form payload */
export function buildOfferFormData(
  body: {
    title: string;
    description: string;
    image?: string;
    imageName?: string;
    discount: number;
    startDate: string;
    endDate: string;
    branchId: number;
    isActive: boolean;
    sortOrder: number;
    productIds: number[];
  },
  imageFile?: File,
): FormData {
  const fd = new FormData();
  if (imageFile) {
    fd.append('image', imageFile);
  } else if (body.image) {
    fd.append('image', body.image);
  }
  if (imageFile && body.imageName) {
    fd.append('imageName', body.imageName);
  }
  appendFormValue(fd, 'title', body.title);
  appendFormValue(fd, 'description', body.description);
  appendFormValue(fd, 'discount', body.discount);
  appendFormValue(fd, 'startDate', body.startDate);
  appendFormValue(fd, 'endDate', body.endDate);
  appendFormValue(fd, 'branchId', body.branchId);
  appendFormValue(fd, 'isActive', body.isActive);
  appendFormValue(fd, 'sortOrder', body.sortOrder);
  body.productIds.forEach((pid) => fd.append('productIds', String(pid)));
  return fd;
}

type OfferFormInput = Parameters<typeof buildOfferFormData>[0];

/** POST /api/admin/offers (multipart) — Admin only */
export function createOffer(body: OfferFormInput, imageFile?: File): Promise<Offer> {
  return http.post<Offer>('/api/admin/offers', buildOfferFormData(body, imageFile), {
    headers: XHR_HEADERS,
  });
}

/** PUT /api/admin/offers/{id} (multipart) — image optional, keeps old if omitted */
export function updateOffer(
  id: string | number,
  body: OfferFormInput,
  imageFile?: File,
): Promise<Offer> {
  return http.put<Offer>(`/api/admin/offers/${encodeURIComponent(String(id))}`, buildOfferFormData(body, imageFile), {
    headers: XHR_HEADERS,
  });
}

/** DELETE /api/admin/offers/{id} */
export function deleteOffer(id: string | number): Promise<boolean> {
  return http.delete<boolean>(`/api/admin/offers/${encodeURIComponent(String(id))}`);
}

/** PATCH /api/admin/offers/{id}/toggle */
export function toggleOffer(id: string | number): Promise<Offer> {
  return http.patch<Offer>(`/api/admin/offers/${encodeURIComponent(String(id))}/toggle`);
}
