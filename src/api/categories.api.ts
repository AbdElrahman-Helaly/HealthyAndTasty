import { http } from '@/lib/apiClient';
import type { AdminCategory } from '@/types';

/** GET /api/admin/categories?homeDisplayOnly=<optional> — Admin, GeneralManager */
export function listAdminCategories(homeDisplayOnly?: boolean): Promise<AdminCategory[]> {
  const params = typeof homeDisplayOnly === 'boolean' ? { homeDisplayOnly } : undefined;
  return http.get<AdminCategory[]>('/api/admin/categories', { params });
}

/** GET /api/admin/categories/{id} — Admin, GeneralManager */
export function getAdminCategory(id: string | number): Promise<AdminCategory> {
  return http.get<AdminCategory>(`/api/admin/categories/${encodeURIComponent(String(id))}`);
}

// Axios must generate the multipart boundary itself, so the Content-Type
// header is cleared (same pattern as offers.api.ts).
const FORM_HEADERS = { 'Content-Type': null as unknown as string };

/** POST /api/admin/categories (multipart) — id, name required; image required */
export function createAdminCategory(
  id: number,
  name: string,
  homeDisplay: boolean,
  imageFile: File,
): Promise<AdminCategory> {
  const fd = new FormData();
  fd.append('id', String(id));
  fd.append('name', name);
  fd.append('homeDisplay', String(homeDisplay));
  fd.append('image', imageFile);
  return http.post<AdminCategory>('/api/admin/categories', fd, { headers: FORM_HEADERS });
}

/** PUT /api/admin/categories/{id} (multipart) — name required; image optional (omit to keep existing) */
export function updateAdminCategory(
  id: string | number,
  name: string,
  homeDisplay: boolean,
  imageFile?: File,
): Promise<AdminCategory> {
  const fd = new FormData();
  fd.append('name', name);
  fd.append('homeDisplay', String(homeDisplay));
  if (imageFile) fd.append('image', imageFile);
  return http.put<AdminCategory>(
    `/api/admin/categories/${encodeURIComponent(String(id))}`,
    fd,
    { headers: FORM_HEADERS },
  );
}

/** DELETE /api/admin/categories/{id} — blocked (400/409) when the category has products */
export function deleteAdminCategory(id: string | number): Promise<boolean> {
  return http.delete<boolean>(`/api/admin/categories/${encodeURIComponent(String(id))}`);
}
