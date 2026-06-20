/**
 * Categories API — all requests use relative paths.
 * The request() function in api.ts injects the country prefix automatically.
 */
import { api } from '@/lib/api';
import type { Category } from '@/types';

export interface CategoryListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateCategoryBody {
  code: string;
  name: string;
  nameAr: string;
  sortOrder: number;
  parentId?: string;
}

export interface UpdateCategoryBody {
  name: string;
  nameAr: string;
  sortOrder: number;
  isActive: boolean;
  parentId?: string;
}

export async function getCategories(_params: CategoryListParams = {}): Promise<Category[]> {
  return api.categories.list();
}

export async function getCategoryById(id: string): Promise<Category | null> {
  return api.categories.getById(id);
}

export async function createCategory(body: CreateCategoryBody): Promise<Category> {
  return api.categories.create({
    name: body.name,
    nameAr: body.nameAr,
    parentId: body.parentId ?? null,
    isActive: true,
  });
}

export async function updateCategory(id: string, body: UpdateCategoryBody): Promise<Category> {
  return api.categories.update({
    id,
    name: body.name,
    nameAr: body.nameAr,
    parentId: body.parentId ?? null,
    isActive: body.isActive,
  });
}

export async function getSubcategories(
  parentId: string,
  _params: CategoryListParams = {},
): Promise<Category[]> {
  // The existing categories list endpoint returns all; filter client-side by parentId
  // If backend exposes GET /categories/{parentId}/subcategories, swap to that call.
  const all = await api.categories.list();
  return all.filter((c) => c.parentId === parentId);
}
