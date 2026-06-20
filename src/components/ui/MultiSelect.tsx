import { useState, useRef, useEffect } from 'react';

interface Option { label: string; value: string; }
interface MultiSelectProps {
  label?: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({ label, options, value, onChange, placeholder }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
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
          onClick={() => setIsOpen(!isOpen)}
        >
          {value.length > 0 ? `${value.length} selected` : (placeholder || 'Select...')}
        </div>
        {isOpen && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-outline-variant/40 bg-surface shadow-lg">
            {options.map(opt => (
              <div 
                key={opt.value}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface-variant/50"
                onClick={() => handleSelect(opt.value)}
              >
                <input type="checkbox" checked={value.includes(opt.value)} readOnly />
                <span>{opt.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
