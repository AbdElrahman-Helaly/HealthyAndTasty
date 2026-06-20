/**
 * Products API — all requests use relative paths.
 * The request() function in api.ts injects the country prefix automatically.
 */
import { api } from '@/lib/api';
import type {
  CreateProductBody,
  ImportHistoryRecord,
  PaginatedResponse,
  Product,
  ProductListParams,
  UpdateProductBody,
} from '@/types';

export type { ProductListParams, CreateProductBody, UpdateProductBody };

export async function getProducts(
  params: ProductListParams = {},
): Promise<PaginatedResponse<Product>> {
  return api.products.list(params);
}

export async function getProductsByBranch(
  branchId: string,
  params: ProductListParams = {},
): Promise<PaginatedResponse<Product>> {
  return api.products.listByBranch(branchId, params);
}

export async function getProductById(id: string): Promise<Product | null> {
  return api.products.getById(id);
}

export async function createProduct(body: CreateProductBody): Promise<Product> {
  return api.products.create(body);
}

export async function updateProduct(id: string, body: UpdateProductBody): Promise<Product> {
  return api.products.update(id, body);
}

export async function deleteProduct(id: string): Promise<void> {
  return api.products.delete(id);
}

export async function importProductsExcel(file: File): Promise<{ message?: string }> {
  return api.products.importExcel(file);
}

export async function getImportHistory(
  params: {
    page?: number;
    pageSize?: number;
    branchId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  } = {},
): Promise<PaginatedResponse<ImportHistoryRecord>> {
  return api.products.importHistory(params);
}
