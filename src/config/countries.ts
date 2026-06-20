/**
 * Country configuration.
 * The supported countries are intentionally fixed locally.
 */

export interface CountryConfig {
  code: string;
  label: string;
  apiPrefix: string;
}

export const COUNTRIES: Record<string, CountryConfig> = {
  eg: {
    code: 'eg',
    label: 'Egypt',
    apiPrefix: '/api/eg',
  },
  sa: {
    code: 'sa',
    label: 'Saudi Arabia',
    apiPrefix: '/api/sa',
  },
  uae: {
    code: 'uae',
    label: 'UAE',
    apiPrefix: '/api/uae',
  },
} as const;

export type CountryCode = keyof typeof COUNTRIES;

export const DEFAULT_COUNTRY: CountryCode = 'eg';
