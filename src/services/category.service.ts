import { api } from '@/lib/api';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types';

const fallbackCategories: Category[] = [
  { id: 'cat-001', name: 'Honey & Spreads', nameAr: 'العسل وال spreads', parentId: null, isActive: true, productCount: 45, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-002', name: 'Oils & Vinegars', nameAr: 'الزيوت والخل', parentId: null, isActive: true, productCount: 32, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-003', name: 'Dried Fruits', nameAr: 'الفواكه المجففة', parentId: null, isActive: true, productCount: 28, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-004', name: 'Beverages', nameAr: 'المشروبات', parentId: null, isActive: true, productCount: 56, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-005', name: 'Organic Honey', nameAr: 'عسل عضوي', parentId: 'cat-001', isActive: true, productCount: 18, createdAt: '2025-06-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

let localCategories = [...fallbackCategories];

export async function getCategories(): Promise<Category[]> {
  try {
    const categories = await api.categories.list();
    if (categories.length > 0) {
      localCategories = categories;
      return categories;
    }
  } catch {
    /* use local store */
  }
  return localCategories;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const category = await api.categories.getById(id);
    if (category) return category;
  } catch {
    /* use local store */
  }
  return localCategories.find((c) => c.id === id) ?? null;
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  try {
    return await api.categories.create(input);
  } catch {
    const category: Category = {
      id: `cat-${Date.now()}`,
      ...input,
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localCategories = [...localCategories, category];
    return category;
  }
}

export async function updateCategory(input: UpdateCategoryInput): Promise<Category> {
  try {
    return await api.categories.update(input);
  } catch {
    localCategories = localCategories.map((c) =>
      c.id === input.id
        ? { ...c, ...input, updatedAt: new Date().toISOString() }
        : c,
    );
    const updated = localCategories.find((c) => c.id === input.id);
    if (!updated) throw new Error('Category not found');
    return updated;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await api.categories.delete(id);
  } catch {
    localCategories = localCategories.filter((c) => c.id !== id);
  }
}
