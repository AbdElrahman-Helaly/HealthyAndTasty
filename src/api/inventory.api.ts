import { http, ApiError } from '@/lib/apiClient';
import type { InventoryListParams, InventoryPage, InventoryProduct } from '@/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const v = value.toLowerCase().trim();
    if (['true', '1', 'yes', 'available'].includes(v)) return true;
    if (['false', '0', 'no'].includes(v)) return false;
  }
  return fallback;
}

/** Normalize any backend product shape into InventoryProduct */
export function normalizeInventoryItem(raw: any, fallbackBranchName = ''): InventoryProduct {
  const stock = toNumber(
    raw?.stock ?? raw?.stockQuantity ?? raw?.quantity ?? raw?.qty ?? raw?.availableQuantity,
    0,
  );
  const isAvailable = (() => {
    if (raw?.isAvailable !== undefined && raw?.isAvailable !== null)
      return toBoolean(raw.isAvailable, stock > 0);
    if (raw?.available !== undefined && raw?.available !== null)
      return toBoolean(raw.available, stock > 0);
    if (raw?.isActive !== undefined && raw?.isActive !== null)
      return toBoolean(raw.isActive, stock > 0);
    return stock > 0;
  })();

  const price = toNumber(raw?.price, 0);
  const priceAfterDiscount = toNumber(
    raw?.priceAfterDiscount ?? raw?.discountedPrice ?? raw?.finalPrice ?? price,
    price,
  );
  const discount = toNumber(
    raw?.discount ?? raw?.discountPercent ?? raw?.discountPercentage,
    price > 0 && priceAfterDiscount < price
      ? Math.round(((price - priceAfterDiscount) / price) * 100)
      : 0,
  );

  return {
    id: toNumber(raw?.id, 0),
    name: String(raw?.name ?? raw?.title ?? '—'),
    image: String(raw?.image ?? raw?.imageUrl ?? raw?.thumbnail ?? ''),
    sku: String(raw?.sku ?? raw?.SKU ?? raw?.code ?? raw?.id ?? '—'),
    categoryId: raw?.categoryId === undefined || raw?.categoryId === null
      ? null
      : toNumber(raw.categoryId),
    categoryName: String(raw?.categoryName ?? raw?.category ?? ''),
    price,
    priceAfterDiscount,
    discount,
    stock,
    isAvailable,
    branchId: raw?.branchId ?? raw?.branchID ?? null,
    branchName: String(raw?.branchName ?? fallbackBranchName ?? ''),
  };
}

function normalizePage(
  payload: any,
  params: Required<Pick<InventoryListParams, 'page' | 'pageSize'>>,
  fallbackBranchName: string,
): InventoryPage {
  // Backend may return: paged object, plain array, or data-wrapped variants
  const container = payload?.items !== undefined ? payload : payload?.data ?? payload;
  const rawItems: any[] = Array.isArray(container)
    ? container
    : Array.isArray(container?.items)
      ? container.items
      : [];
  const items = rawItems.map((r) => normalizeInventoryItem(r, fallbackBranchName));
  const totalCount = toNumber(
    container?.totalCount ?? container?.total ?? items.length,
    items.length,
  );
  const page = toNumber(container?.page ?? params.page, params.page);
  const pageSize = toNumber(container?.pageSize ?? params.pageSize, params.pageSize);
  const totalPages = toNumber(
    container?.totalPages ?? (pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1),
    1,
  );
  return { items, totalCount, page, pageSize, totalPages: Math.max(1, totalPages) };
}

/**
 * GET /api/admin/products?branchId=1&page=1&pageSize=20&search=milk
 *
 * Falls back to GET /api/catalog/products when the admin endpoint is not
 * available, with client-side search + branch annotation so the UI keeps
 * working with the same contract.
 */
export async function listInventoryProducts(
  params: InventoryListParams = {},
  fallbackBranchName = '',
  allowCatalogFallback = true,
): Promise<InventoryPage> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const search = params.search?.trim() || undefined;
  const branchId =
    params.branchId === '' || params.branchId === undefined || params.branchId === null
      ? undefined
      : params.branchId;
  const categoryId =
    params.categoryId === '' || params.categoryId === undefined || params.categoryId === null
      ? undefined
      : params.categoryId;

  // 1) Preferred: admin endpoint with server-side branchId + search + paging
  try {
    const query: Record<string, string> = {
      page: String(page),
      pageSize: String(pageSize),
    };
    if (branchId !== undefined) query.branchId = String(branchId);
    if (categoryId !== undefined) query.categoryId = String(categoryId);
    if (search) query.search = search;
    const payload = await http.get<unknown>('/api/admin/products', { params: query });
    return normalizePage(payload, { page, pageSize }, fallbackBranchName);
  } catch (err) {
    // Fall back to catalog ONLY when the admin endpoint doesn't exist (404).
    // Any other failure (400/500 — e.g. bad branchId) must surface instead of
    // silently showing unfiltered data that looks like "filter not working".
    if (!allowCatalogFallback || !(err instanceof ApiError) || err.status !== 404) throw err;
  }

  // 2) Fallback: public catalog endpoint (no branch support) + client-side filtering
  const catalog = await http.get<unknown>('/api/catalog/products', {
    params: { page: String(page), pageSize: String(pageSize) },
  });
  let normalized = normalizePage(catalog, { page, pageSize }, fallbackBranchName);

  if (search) {
    const q = search.toLowerCase();
    const filtered = normalized.items.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
    // When filtering client-side, the filtered set IS the page
    normalized = {
      ...normalized,
      items: filtered,
      totalCount: filtered.length,
      totalPages: 1,
    };
  }

  if (categoryId !== undefined) {
    const filtered = normalized.items.filter((product) => String(product.categoryId) === String(categoryId));
    normalized = { ...normalized, items: filtered, totalCount: filtered.length, totalPages: 1 };
  }

  return normalized;
}

/** GET /api/admin/products/export — authenticated Excel file download. */
export function exportInventoryProducts(
  params: Pick<InventoryListParams, 'branchId' | 'categoryId' | 'search'>,
): Promise<Blob> {
  const query: Record<string, string> = {};
  if (params.branchId !== undefined && params.branchId !== '') query.branchId = String(params.branchId);
  if (params.categoryId !== undefined && params.categoryId !== '') query.categoryId = String(params.categoryId);
  if (params.search?.trim()) query.search = params.search.trim();
  return http.get<Blob>('/api/admin/products/export', { params: query, responseType: 'blob' });
}
