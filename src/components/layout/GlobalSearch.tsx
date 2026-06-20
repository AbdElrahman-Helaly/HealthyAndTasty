import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import type { SearchResultItem } from '@/types';

export function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { results, isLoading, total } = useGlobalSearch(query);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(item: SearchResultItem) {
    navigate(item.href);
    setQuery('');
    setOpen(false);
  }

  const groups = [
    { key: 'branches', label: t('search.branches'), items: results.branches },
    { key: 'employees', label: t('search.employees'), items: results.employees },
    { key: 'products', label: t('search.products'), items: results.products },
    { key: 'categories', label: t('search.categories'), items: results.categories },
  ].filter((g) => g.items.length > 0);

  return (
    <div ref={ref} className="relative hidden md:block w-full max-w-xs">
      <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={t('search.placeholder')}
        className="h-9 w-full rounded-lg border border-outline-variant/60 bg-surface-container/50 ps-9 pe-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {open && query.trim() && (
        <div className="absolute top-full mt-1 w-80 rounded-xl border border-outline-variant/40 bg-surface shadow-lg z-50 overflow-hidden">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-on-surface-variant">{t('common.loading')}</div>
          ) : total === 0 ? (
            <div className="px-4 py-3 text-sm text-on-surface-variant">{t('common.noResults')}</div>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1">
              {groups.map((group) => (
                <div key={group.key}>
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                    {group.label}
                  </p>
                  {group.items.map((item, i) => (
                    <button
                      key={`${group.key}-${item.id || i}`}
                      onClick={() => handleSelect(item)}
                      className="flex w-full flex-col px-3 py-2 text-start hover:bg-surface-container transition-colors"
                    >
                      <span className="text-sm font-medium text-on-surface">{item.title}</span>
                      <span className="text-xs text-on-surface-variant">{item.subtitle}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
