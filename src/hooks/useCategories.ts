import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from '@/services/category.service';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/types';
import { useAsync, useMutation } from './useAsync';

export function useCategories() {
  return useAsync(getCategories, []);
}

export function useCategory(id: string | undefined) {
  return useAsync(
    () => (id ? getCategoryById(id) : Promise.resolve(null)),
    [id],
  );
}

export function useCreateCategory() {
  return useMutation((input: CreateCategoryInput) => createCategory(input));
}

export function useUpdateCategory() {
  return useMutation((input: UpdateCategoryInput) => updateCategory(input));
}

export function useDeleteCategory() {
  return useMutation((id: string) => deleteCategory(id).then(() => id));
}
