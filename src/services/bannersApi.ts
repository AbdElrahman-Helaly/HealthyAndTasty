/**
 * Banners API — uses the full absolute path /api/admin/banners.
 * This endpoint is listed in GLOBAL_PATHS so the country prefix is NOT injected.
 *
 * GET / DELETE / PATCH use the shared request() from api.ts — it already reads
 * the token from the correct localStorage key and attaches Authorization correctly.
 *
 * POST / PUT are multipart (FormData) so they call fetch() directly, matching
 * the same pattern as api.products.importExcel in api.ts.
 */
import { env } from '@/config/env';
import { ApiError, api } from '@/lib/api';
import type { Banner } from '@/types';
import type { ApiErrorPayload } from '@/types';

// ---------------------------------------------------------------------------
// Image URL helper
// ---------------------------------------------------------------------------

const API_ORIGIN = 'https://healthyandtasty.runasp.net';

/**
 * Converts a relative image path like /uploads/banners/xxx.png into an
 * absolute URL using the production API origin.
 * If imageUrl is already absolute it is returned unchanged.
 */
export function getFullImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  return `${API_ORIGIN}${imageUrl}`;
}

// ---------------------------------------------------------------------------
// Auth token helper — reads from the SAME key as api.ts
// ---------------------------------------------------------------------------
function getToken(): string | null {
  const raw = localStorage.getItem('ht_superadmin_token');
  if (!raw) return null;
  return raw.startsWith('Bearer ') ? raw.slice(7) : raw;
}

// ---------------------------------------------------------------------------
// Multipart fetch helper — only used for create / update (FormData bodies)
// Mirrors api.products.importExcel: manual fetch with Authorization header.
// ---------------------------------------------------------------------------
async function multipartRequest<T>(
  method: 'POST' | 'PUT',
  path: string,
  formData: FormData,
): Promise<T> {
  const url = `${env.apiBaseUrl}${path}`;
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { method, headers, body: formData });

  if (!response.ok) {
    let payload: ApiErrorPayload = {};
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      /* non-JSON body */
    }
    throw new ApiError(response.status, payload);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * GET /api/admin/banners
 * Uses api.banners.list() which routes through the shared request() in api.ts —
 * guaranteed to carry the correct Authorization header.
 */
export async function getBanners(): Promise<Banner[]> {
  return api.banners.list();
}

/**
 * GET /api/admin/banners/{id}
 */
export async function getBannerById(id: string): Promise<Banner> {
  return api.banners.getById(id);
}

export interface CreateBannerData {
  file: File;
  categoryId: string;
  isActive: boolean;
  sortOrder: number;
}

/**
 * POST /api/admin/banners  (multipart/form-data)
 */
export async function createBanner(data: CreateBannerData): Promise<{ id: string }> {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('categoryId', data.categoryId);
  formData.append('isActive', String(data.isActive));
  formData.append('sortOrder', String(data.sortOrder));
  return multipartRequest<{ id: string }>('POST', '/api/admin/banners', formData);
}

export interface UpdateBannerData {
  file?: File;
  categoryId: string;
  isActive: boolean;
  sortOrder: number;
}

/**
 * PUT /api/admin/banners/{id}  (multipart/form-data)
 * file is optional — omit it to keep the existing image.
 */
export async function updateBanner(id: string, data: UpdateBannerData): Promise<void> {
  const formData = new FormData();
  if (data.file) formData.append('file', data.file);
  formData.append('categoryId', data.categoryId);
  formData.append('isActive', String(data.isActive));
  formData.append('sortOrder', String(data.sortOrder));
  await multipartRequest<void>('PUT', `/api/admin/banners/${encodeURIComponent(id)}`, formData);
}

/**
 * DELETE /api/admin/banners/{id}
 */
export async function deleteBanner(id: string): Promise<void> {
  return api.banners.delete(id);
}

/**
 * PATCH /api/admin/banners/{id}/toggle
 */
export async function toggleBanner(id: string): Promise<{ id: string; isActive: boolean }> {
  return api.banners.toggle(id);
}
