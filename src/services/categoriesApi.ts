/**
 * Categories API — all requests use relative paths.
 * The request() function in api.ts injects the country prefix automatically.
 */
import { api } from '@/lib/api';
import type { Category, CategoryListParams } from '@/types';

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
  return api.categories.list(_params);
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
  params: CategoryListParams = {},
): Promise<Category[]> {
  return api.categories.listSubcategories(parentId, params);
}
