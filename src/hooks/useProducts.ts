import { getProducts } from '@/services/product.service';
import { useAsync } from './useAsync';

export function useProducts() {
  return useAsync(getProducts, []);
}
