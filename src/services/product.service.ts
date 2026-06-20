import { mockProducts } from '@/data/mockProducts';
import type { Product } from '@/types';

export async function getProducts(): Promise<Product[]> {
  // Future: return api.products.list();
  return mockProducts;
}

export async function getProductById(id: string): Promise<Product | null> {
  // Future: return api.products.getById(id);
  return mockProducts.find((p) => p.id === id) ?? null;
}
