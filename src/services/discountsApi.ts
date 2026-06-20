import { request } from '@/lib/api';
import type {
  Discount,
  DiscountTypeOption,
  DiscountTargetOption,
  CreateDiscountBody,
  UpdateDiscountBody,
} from '@/types';

/**
 * GET /api/admin/discounts
 */
export async function getDiscounts(): Promise<Discount[]> {
  const raw = await request<unknown>('GET', '/api/admin/discounts');
  if (Array.isArray(raw)) return raw as Discount[];
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const items = r.items ?? r.data ?? r.discounts;
    if (Array.isArray(items)) return items as Discount[];
  }
  return [];
}

/**
 * GET /api/admin/discounts/types
 */
export async function getDiscountTypes(): Promise<DiscountTypeOption[]> {
  const raw = await request<unknown>('GET', '/api/admin/discounts/types');
  if (Array.isArray(raw)) return raw as DiscountTypeOption[];
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const items = r.items ?? r.data;
    if (Array.isArray(items)) return items as DiscountTypeOption[];
  }
  return [];
}

/**
 * GET /api/admin/discounts/targets
 */
export async function getDiscountTargets(): Promise<DiscountTargetOption[]> {
  const raw = await request<unknown>('GET', '/api/admin/discounts/targets');
  if (Array.isArray(raw)) return raw as DiscountTargetOption[];
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const items = r.items ?? r.data;
    if (Array.isArray(items)) return items as DiscountTargetOption[];
  }
  return [];
}

/**
 * POST /api/admin/discounts
 */
export async function createDiscount(body: CreateDiscountBody): Promise<void> {
  await request<void>('POST', '/api/admin/discounts', body);
}

/**
 * PUT /api/admin/discounts/{id}
 */
export async function updateDiscount(id: string, body: UpdateDiscountBody): Promise<void> {
  await request<void>('PUT', `/api/admin/discounts/${encodeURIComponent(id)}`, body);
}

/**
 * DELETE /api/admin/discounts/{id}
 */
export async function deleteDiscount(id: string): Promise<void> {
  await request<void>('DELETE', `/api/admin/discounts/${encodeURIComponent(id)}`);
}

/**
 * PATCH /api/admin/discounts/{id}/toggle
 */
export async function toggleDiscount(id: string): Promise<{ id: string; isActive: boolean }> {
  return request<{ id: string; isActive: boolean }>(
    'PATCH',
    `/api/admin/discounts/${encodeURIComponent(id)}/toggle`,
  );
}
