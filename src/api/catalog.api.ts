import { http } from '@/lib/apiClient';
import type { CatalogProduct, CatalogProductPage } from '@/types';

export function getCatalogProductsPage(page = 1, pageSize = 100): Promise<CatalogProductPage> {
  return http.get('/api/catalog/products', { params: { page, pageSize } });
}

/** GET /api/catalog/products — returns a paged list */
export async function listCatalogProducts(
  page = 1,
  pageSize = 100,
): Promise<CatalogProduct[]> {
  const params = { page: String(page), pageSize: String(pageSize) };
  const result = await http.get<CatalogProductPage>('/api/catalog/products', { params });
  return result.items ?? [];
}
