/**
 * CountryContext — tracks the currently selected country region.
 *
 * Selected country is persisted to localStorage under 'ht_country'.
 * All api.ts requests read from this context via `getSelectedCountryPrefix()`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { COUNTRIES, DEFAULT_COUNTRY, type CountryCode } from '@/config/countries';

const STORAGE_KEY = 'ht_country';

interface CountryContextValue {
  selectedCountry: CountryCode;
  setCountry: (code: CountryCode) => void;
}

const CountryContext = createContext<CountryContextValue | null>(null);

function loadStoredCountry(): CountryCode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored in COUNTRIES) return stored as CountryCode;
  return DEFAULT_COUNTRY;
}

export function CountryProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(loadStoredCountry);

  const setCountry = useCallback((code: CountryCode) => {
    if (!(code in COUNTRIES)) return;
    localStorage.setItem(STORAGE_KEY, code);
    setSelectedCountry(code);
  }, []);

  const value = useMemo(
    () => ({ selectedCountry, setCountry }),
    [selectedCountry, setCountry],
  );

  return (
    <CountryContext.Provider value={value}>{children}</CountryContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error('useCountry must be used within CountryProvider');
  return ctx;
}

/**
 * Read the active country's API prefix without going through React hooks.
 * Used by the api.ts request function (non-component context).
 */
export function getSelectedCountryPrefix(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  const code = stored && stored in COUNTRIES ? (stored as CountryCode) : DEFAULT_COUNTRY;
  return COUNTRIES[code].apiPrefix;
}
