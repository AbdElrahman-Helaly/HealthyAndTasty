import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listOrders } from '@/api/orders.api';
import { listEmployees } from '@/api/employees.api';
import { listBranches } from '@/api/branches.api';
import type { SearchResultItem } from '@/types';

export function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ branches: SearchResultItem[]; employees: SearchResultItem[]; orders: SearchResultItem[] }>({
    branches: [],
    employees: [],
    orders: [],
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults({ branches: [], employees: [], orders: [] });
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [orders, employees, branches] = await Promise.all([
          listOrders({ search: q, page: 1, pageSize: 5 }).catch(() => null),
          listEmployees({ search: q, page: 1, pageSize: 5 }).catch(() => null),
          listBranches().catch(() => null),
        ]);
        if (cancelled) return;
        setResults({
          orders: (orders?.items ?? []).map((o) => ({
            id: String(o.id),
            type: 'order',
            title: o.orderNumber,
            subtitle: `${o.customerName} — ${o.branchName}`,
            href: `/orders/${o.id}`,
          })),
          employees: (employees?.items ?? []).map((e) => ({
            id: String(e.id),
            type: 'employee',
            title: e.name,
            subtitle: e.email || e.phone,
            href: `/employees/${e.id}`,
          })),
          branches: (branches ?? [])
            .filter((b) => b.name.toLowerCase().includes(q.toLowerCase()))
            .slice(0, 5)
            .map((b) => ({
              id: b.id,
              type: 'branch',
              title: b.name,
              subtitle: b.address || `Odoo #${b.odooBranchId}`,
              href: `/branches`,
            })),
        });
      } catch {
        if (!cancelled) setResults({ branches: [], employees: [], orders: [] });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const total = results.branches.length + results.employees.length + results.orders.length;

  function handleSelect(item: SearchResultItem) {
    navigate(item.href);
    setQuery('');
    setOpen(false);
  }

  const groups = [
    { key: 'branches', label: t('search.branches'), items: results.branches },
    { key: 'employees', label: t('search.employees'), items: results.employees },
    { key: 'orders', label: t('search.orders'), items: results.orders },
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
