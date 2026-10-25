import { http } from '@/lib/apiClient';
import type { CatalogProduct, PagedResult } from '@/types';

export interface Banner {
  id: number;
  title: string;
  url: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  productIds: number[];
  categoryIds: number[];
}

export interface BannerProduct extends CatalogProduct {
  stock?: number;
  stockQuantity?: number;
  isAvailable?: boolean;
}

export function listBanners(): Promise<Banner[]> {
  return http.get('/api/banners');
}

/** DELETE /api/banners/{id} */
export function deleteBanner(id: number): Promise<unknown> {
  return http.delete(`/api/banners/${encodeURIComponent(String(id))}`);
}

export function saveBanner(banner: Omit<Banner, 'id' | 'image'>, image?: File, id?: number): Promise<unknown> {
  const body = new FormData();
  if (banner.title.trim()) body.append('Title', banner.title);
  body.append('Url', banner.url);
  body.append('IsActive', String(banner.isActive));
  body.append('SortOrder', String(banner.sortOrder));
  if (image) body.append('Image', image);
  banner.productIds.forEach(value => body.append('ProductIds', String(value)));
  banner.categoryIds.forEach(value => body.append('CategoryIds', String(value)));
  // Clear the JSON default so Axios/the browser can supply the multipart boundary.
  const config = { headers: { 'Content-Type': null } };
  return id !== undefined ? http.put(`/api/banners/${encodeURIComponent(id)}`, body, config) : http.post('/api/banners', body, config);
}

export function listBannerProducts(id: number, page: number): Promise<PagedResult<BannerProduct>> {
  return http.get(`/api/banners/${encodeURIComponent(id)}/products`, { params: { page, pageSize: 20 } });
}
