import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface SearchFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
  className?: string;
}

export function SearchFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  children,
  className,
}: SearchFiltersProps) {
  return (
    <div className={cn('flex flex-wrap items-end gap-3 mb-5', className)}>
      <div className="relative min-w-[200px] flex-1 max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 w-full rounded-lg border border-outline-variant bg-surface ps-9 pe-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      {children}
    </div>
  );
}

interface SelectFilterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function SelectFilter({ label, value, onChange, options }: SelectFilterProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-on-surface-variant">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-outline-variant bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
