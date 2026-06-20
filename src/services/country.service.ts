import type { Country, CountryDetails, CountryStats } from '@/types';

const fallbackCountries: Country[] = [
  {
    id: 'eg',
    code: 'EG',
    name: 'Egypt',
    nameAr: 'Egypt',
    isActive: true,
    branchCount: 18,
    employeeCount: 72,
    productCount: 1240,
  },
  {
    id: 'sa',
    code: 'SA',
    name: 'Saudi Arabia',
    nameAr: 'Saudi Arabia',
    isActive: true,
    branchCount: 15,
    employeeCount: 58,
    productCount: 890,
  },
  {
    id: 'ae',
    code: 'AE',
    name: 'UAE',
    nameAr: 'UAE',
    isActive: true,
    branchCount: 14,
    employeeCount: 56,
    productCount: 710,
  },
];

function mockStats(country: Country): CountryStats {
  return {
    branchCount: country.branchCount ?? 0,
    activeBranches: Math.round((country.branchCount ?? 0) * 0.9),
    employeeCount: country.employeeCount ?? 0,
    productCount: country.productCount ?? 0,
    importsThisMonth: Math.round((country.branchCount ?? 0) * 5.2),
  };
}

export async function getCountries(): Promise<Country[]> {
  return fallbackCountries;
}

export async function getCountryById(id: string): Promise<CountryDetails | null> {
  const country =
    fallbackCountries.find((c) => c.id === id || c.code.toLowerCase() === id.toLowerCase()) ?? null;

  if (!country) return null;

  return {
    ...country,
    stats: mockStats(country),
    currency: country.code === 'EG' ? 'EGP' : country.code === 'SA' ? 'SAR' : 'AED',
    timezone: country.code === 'EG' ? 'Africa/Cairo' : country.code === 'SA' ? 'Asia/Riyadh' : 'Asia/Dubai',
  };
}
