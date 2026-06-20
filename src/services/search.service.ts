import { getCategories } from '@/services/category.service';
import { getBranches } from '@/services/branch.service';
import { getEmployees } from '@/services/employee.service';
import { getProducts } from '@/services/product.service';
import type { SearchResults, SearchResultItem } from '@/types';

function matchQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

async function searchBranches(query: string): Promise<SearchResultItem[]> {
  const branches = await getBranches();
  return branches
    .filter((b) => matchQuery(b.name, query) || matchQuery(b.code, query))
    .slice(0, 5)
    .map((b) => ({
      id: b.id,
      type: 'branch' as const,
      title: b.name,
      subtitle: `${b.code} · ${b.countryName}`,
      href: `/branches/${b.id}`,
    }));
}

async function searchEmployees(query: string): Promise<SearchResultItem[]> {
  const { items: employees } = await getEmployees();
  return employees
    .filter(
      (e) =>
        matchQuery(e.displayName, query) ||
        matchQuery(e.employeeCode, query) ||
        matchQuery(e.email, query),
    )
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      type: 'employee' as const,
      title: e.displayName,
      subtitle: e.employeeCode || e.email,
      href: `/employees/${e.id}`,
    }));
}

async function searchProducts(query: string): Promise<SearchResultItem[]> {
  const products = await getProducts();
  return products
    .filter((p) => matchQuery(p.name, query) || matchQuery(p.sku, query))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      type: 'product' as const,
      title: p.name,
      subtitle: `${p.sku} · ${p.categoryName}`,
      href: `/products`,
    }));
}

async function searchCategories(query: string): Promise<SearchResultItem[]> {
  const categories = await getCategories();
  return categories
    .filter((c) => matchQuery(c.name, query) || matchQuery(c.nameAr, query))
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      type: 'category' as const,
      title: c.name,
      subtitle: c.parentId ? 'Subcategory' : 'Root category',
      href: `/categories/${c.id}`,
    }));
}

export async function globalSearch(query: string): Promise<SearchResults> {
  if (!query.trim()) {
    return { branches: [], employees: [], products: [], categories: [] };
  }

  const [branches, employees, products, categories] = await Promise.all([
    searchBranches(query),
    searchEmployees(query),
    searchProducts(query),
    searchCategories(query),
  ]);

  return { branches, employees, products, categories };
}
