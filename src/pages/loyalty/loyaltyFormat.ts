import type { UserManagement } from '@/types';
import { formatDate } from '@/lib/utils';

export function customerLabel({ id, name, phone, email }: UserManagement): string {
  return [name || `#${id}`, phone || email].filter(Boolean).join(' · ');
}

export function loyaltyMoney(value: number | null, locale: string): string {
  return value == null ? '—' : new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EGP',
    currencyDisplay: 'code',
  }).format(value);
}

export function loyaltyTimestamp(value: string | null, locale: string): string {
  if (!value) return '—';
  const utc = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
  return Number.isNaN(Date.parse(utc)) ? '—' : formatDate(utc, locale);
}
