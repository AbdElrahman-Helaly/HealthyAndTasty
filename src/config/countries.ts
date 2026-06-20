/**
 * Country configuration.
 * Each entry maps a country code to its display label and API prefix.
 * All API calls go through the prefix — never hardcode /api/eg directly.
 */

export interface CountryConfig {
  code: string;
  label: string;
  apiPrefix: string;
}

export const COUNTRIES: Record<string, CountryConfig> = {
  eg: {
    code: 'eg',
    label: 'مصر',
    apiPrefix: '/api/eg',
  },
  sa: {
    code: 'sa',
    label: 'السعودية',
    apiPrefix: '/api/sa',
  },
  uae: {
    code: 'uae',
    label: 'الإمارات',
    apiPrefix: '/api/uae',
  },
} as const;

export type CountryCode = keyof typeof COUNTRIES;

export const DEFAULT_COUNTRY: CountryCode = 'eg';
