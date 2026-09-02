import { http } from '@/lib/apiClient';
import type { CatalogProduct } from '@/types';

/** GET /api/catalog/products */
export function listCatalogProducts(): Promise<CatalogProduct[]> {
  return http.get<CatalogProduct[]>('/api/catalog/products');
}