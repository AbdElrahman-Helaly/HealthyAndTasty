/**
 * CountrySwitcher — dropdown to switch between country regions.
 * Persists the selection to localStorage and reloads the page so
 * all in-flight queries are refetched against the new country prefix.
 */

import { MapPin } from 'lucide-react';
import { COUNTRIES, type CountryCode } from '@/config/countries';
import { useCountry } from '@/context/CountryContext';

export function CountrySwitcher() {
  const { selectedCountry, setCountry } = useCountry();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value as CountryCode;
    setCountry(code);
    // Reload so all cached/in-flight data is refetched for the new region
    window.location.reload();
  }

  return (
    <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-outline-variant/60 px-2 py-1 text-sm text-on-surface-variant hover:bg-surface-container transition-colors">
      <MapPin className="h-4 w-4 shrink-0 text-primary" />
      <select
        value={selectedCountry}
        onChange={handleChange}
        className="bg-transparent text-sm text-on-surface cursor-pointer focus:outline-none"
        aria-label="Select country region"
      >
        {Object.values(COUNTRIES).map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
