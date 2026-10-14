import { useState, useRef, useEffect } from 'react';

interface Option { label: string; value: string; }
interface MultiSelectProps {
  label?: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
}

export function MultiSelect({ label, options, value, onChange, placeholder, searchable, searchPlaceholder, noResultsText }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchable && query.trim()
    ? options.filter((opt) => opt.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && <label className="text-sm font-medium text-on-surface">{label}</label>}
      <div className="relative">
        <div 
          className="min-h-10 w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm text-on-surface cursor-pointer"
          onClick={() => {
            setIsOpen(!isOpen);
            if (isOpen) setQuery('');
          }}
        >
          {value.length > 0 ? value.map(item => options.find(option => option.value === item)?.label ?? item).join('، ') : (placeholder || 'Select...')}
        </div>
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border border-outline-variant/40 bg-surface shadow-lg">
            {searchable && (
              <div className="border-b border-outline-variant/40 p-2">
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={searchPlaceholder || 'Search...'}
                  className="h-9 w-full rounded-lg border border-outline-variant/40 bg-surface px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
            <div className="max-h-60 overflow-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(opt => (
                  <div 
                    key={opt.value}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface-variant/50"
                    onClick={() => handleSelect(opt.value)}
                  >
                    <input type="checkbox" checked={value.includes(opt.value)} readOnly />
                    <span>{opt.label}</span>
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-on-surface-variant/60">
                  {noResultsText || 'No results found'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
