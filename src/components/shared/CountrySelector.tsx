import { useCountries } from '@/hooks/useCountries';
import { cn } from '@/lib/utils';

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  includeAll?: boolean;
  allLabel?: string;
  className?: string;
  label?: string;
}

export function CountrySelector({
  value,
  onChange,
  includeAll = false,
  allLabel = 'All Countries',
  className,
  label,
}: CountrySelectorProps) {
  const { data: countries, isLoading } = useCountries();

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-xs font-medium text-on-surface-variant">{label}</label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        className="h-10 rounded-lg border border-outline-variant bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {includeAll && <option value="">{allLabel}</option>}
        {(countries ?? []).map((country, i) => (
          <option key={country.id || `country-${i}`} value={country.id}>
            {country.name} ({country.code})
          </option>
        ))}
      </select>
    </div>
  );
}
