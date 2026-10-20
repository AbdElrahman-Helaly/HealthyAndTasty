import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  RefreshCw,
  Package,
  Building2,
  PackageSearch,
  ImageOff,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { listBranches } from '@/api/branches.api';
import { listInventoryProducts } from '@/api/inventory.api';
import type { BranchAdmin, InventoryProduct } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ApiImage, resolveImageUrl } from '@/components/ui/ApiImage';
import { useAuth } from '@/context/AuthContext';

const PAGE_SIZE = 20;

function resolveImage(src: string): string {
  return resolveImageUrl(src);
}

function formatPrice(value: number): string {
  return `${Number(value ?? 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م`;
}

export function InventoryPage() {
  const { t } = useTranslation();
  const { user, assignedBranches } = useAuth();
  const branchEmployee = user?.role.toLowerCase() === 'branchemployee';
  const [rows, setRows] = useState<InventoryProduct[]>([]);
  const [branches, setBranches] = useState<Pick<BranchAdmin, 'id' | 'name' | 'odooBranchId'>[]>([]);
  const [branchId, setBranchId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [error, setError] = useState('');
  usePageTitle(t('inventory.title'));

  // /api/admin/products?branchId= expects the numeric branch id (int32),
  // i.e. odooBranchId — NOT the string admin id. Match either to be safe.
  const findBranch = useCallback(
    (value: string | number | null | undefined) =>
      branches.find(
        (b) => String(b.odooBranchId) === String(value) || String(b.id) === String(value),
      ),
    [branches],
  );

  const selectedBranch = useMemo(
    () => (branchId ? findBranch(branchId) : undefined),
    [branches, branchId, findBranch],
  );

  const loadBranches = useCallback(async () => {
    setBranchesLoading(true);
    if (branchEmployee) {
      setBranches(assignedBranches.map(branch => ({ id: branch.branchId, name: branch.name, odooBranchId: branch.odooBranchId })));
      setBranchId(previous => assignedBranches.some(branch => String(branch.odooBranchId) === previous) ? previous : assignedBranches[0] ? String(assignedBranches[0].odooBranchId) : '');
      setBranchesLoading(false);
      return;
    }
    try {
      const list = await listBranches();
      setBranches(list ?? []);
    } catch {
      // Branches dropdown is optional — inventory still works with "all branches"
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  }, [branchEmployee, assignedBranches]);

  const load = useCallback(
    async (p: number, opts: { branchId: string; search: string }) => {
      setLoading(true);
      setError('');
      try {
        if (branchEmployee && !assignedBranches.some(branch => String(branch.odooBranchId) === opts.branchId)) {
          setRows([]); setTotalCount(0); setTotalPages(1);
          setError(assignedBranches.length ? 'اختر فرعك لعرض منتجاته' : 'لا يوجد فرع مسند لحسابك');
          return;
        }
        const res = await listInventoryProducts(
          {
            page: p,
            pageSize: PAGE_SIZE,
            branchId: opts.branchId || undefined,
            search: opts.search || undefined,
          },
          opts.branchId ? (findBranch(opts.branchId)?.name ?? '') : '',
          !branchEmployee,
        );
        // Enrich branchName when backend doesn't return it (catalog fallback)
        const enriched = res.items.map((item) => {
          if (item.branchName) return item;
          if (opts.branchId) {
            const name = findBranch(opts.branchId)?.name ?? '';
            return { ...item, branchId: opts.branchId, branchName: name };
          }
          const byId = item.branchId ? findBranch(item.branchId)?.name : undefined;
          return byId ? { ...item, branchName: byId } : item;
        });
        setRows(enriched);
        setTotalCount(res.totalCount);
        setTotalPages(Math.max(1, res.totalPages));
        setPage(p);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'فشل تحميل المخزون');
      } finally {
        setLoading(false);
      }
    },
    [findBranch, branchEmployee, assignedBranches],
  );

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  // Debounced reload on filter/search change (reset to page 1)
  useEffect(() => {
    const timer = setTimeout(() => {
      void load(1, { branchId, search: search.trim() });
    }, 300);
    return () => clearTimeout(timer);
  }, [branchId, search, load]);

  const handleBranchChange = (value: string) => {
    setBranchId(value);
    setPage(1);
  };

  const handleRefresh = () => {
    void loadBranches();
    void load(page, { branchId, search: search.trim() });
  };

  const columns = useMemo<Column<InventoryProduct>[]>(
    () => [
      {
        key: 'image',
        header: 'الصورة',
        render: (p) => {
          const src = resolveImage(p.image);
          return (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-surface text-primary">
              {src ? (
                <ApiImage
                  src={src}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageOff className="h-4 w-4" />
              )}
            </div>
          );
        },
      },
      {
        key: 'name',
        header: 'اسم المنتج',
        render: (p) => (
          <span className="font-medium text-on-surface block max-w-[220px] truncate" title={p.name}>
            {p.name}
          </span>
        ),
      },
      {
        key: 'sku',
        header: 'SKU',
        render: (p) => (
          <span className="font-mono text-xs font-semibold text-on-surface-variant">{p.sku}</span>
        ),
      },
      {
        key: 'category',
        header: 'التصنيف',
        render: (p) => (
          <span className="text-on-surface-variant/90">{p.categoryName || '—'}</span>
        ),
      },
      {
        key: 'price',
        header: 'السعر',
        render: (p) => (
          <span className="font-medium text-on-surface tabular-nums">{formatPrice(p.price)}</span>
        ),
      },
      {
        key: 'priceAfterDiscount',
        header: 'السعر بعد الخصم',
        render: (p) => (
          <span className="font-semibold text-primary tabular-nums">
            {formatPrice(p.priceAfterDiscount)}
          </span>
        ),
      },
      {
        key: 'discount',
        header: 'الخصم',
        render: (p) =>
          Number(p.discount) > 0 ? (
            <span className="inline-flex items-center rounded-lg bg-success/10 px-2 py-1 text-xs font-bold text-success tabular-nums">
              {Number(p.discount)}%
            </span>
          ) : (
            <span className="text-xs text-on-surface-variant/50">—</span>
          ),
      },
      {
        key: 'stock',
        header: 'المخزون',
        render: (p) => (
          <span
            className={`inline-flex min-w-10 items-center justify-center rounded-lg px-2 py-1 text-sm font-bold tabular-nums ${
              p.stock <= 0
                ? 'bg-error/10 text-error'
                : p.stock < 10
                  ? 'bg-warning/10 text-warning'
                  : 'bg-surface-container text-on-surface'
            }`}
          >
            {p.stock}
          </span>
        ),
      },
      {
        key: 'availability',
        header: 'التوفر',
        render: (p) => (
          <Badge variant={p.isAvailable ? 'success' : 'error'}>
            {p.isAvailable ? 'Available' : 'Not Available'}
          </Badge>
        ),
      },
      {
        key: 'branch',
        header: 'الفرع',
        render: (p) => (
          <span className="text-on-surface-variant/80 whitespace-nowrap">
            {p.branchName || '—'}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title={t('inventory.title')}
        subtitle={t('inventory.subtitle')}
        actions={
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <StatCard
          label="إجمالي عدد المنتجات المعروضة"
          value={loading ? '...' : totalCount.toLocaleString('ar-EG')}
          icon={<Package className="h-5 w-5" />}
          iconColor="#7C3AED"
          comparisonText={
            branchId && selectedBranch
              ? `في فرع ${selectedBranch.name}`
              : branchEmployee ? 'منتجات الفرع المسند لحسابك' : 'من كل الفروع'
          }
          index={0}
        />
        <StatCard
          label="الفرع المختار"
          value={branchId ? (selectedBranch?.name ?? '—') : branchEmployee ? 'غير محدد' : 'كل الفروع'}
          icon={<Building2 className="h-5 w-5" />}
          iconColor="#EA580C"
          comparisonText={
            branchId ? `${totalCount.toLocaleString('ar-EG')} منتج في هذا الفرع` : branchEmployee ? 'اختر الفرع المسند لحسابك' : 'عرض كل المنتجات من كل الفروع'
          }
          index={1}
        />
      </div>

      {/* Filters */}
      <Card padding="md" className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_280px] gap-3">
          <Input
            label="بحث"
            placeholder="ابحث بالاسم أو SKU..."
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            label="الفرع"
            value={branchId}
            disabled={branchesLoading}
            onChange={(e) => handleBranchChange(e.target.value)}
          >
            {!branchEmployee && <option value="">كل الفروع</option>}
            {branches.map((b) => (
              <option key={b.id} value={String(b.odooBranchId ?? b.id)}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Spinner className="h-8 w-8" />
            <p className="text-sm text-on-surface-variant">جاري تحميل المنتجات...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <p className="text-sm font-medium text-on-surface-variant">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => void load(page, { branchId, search: search.trim() })}
            >
              إعادة المحاولة
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-surface text-primary mb-3">
                  <PackageSearch className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-on-surface">لا توجد منتجات</p>
                <p className="mt-1 text-xs text-on-surface-variant/70">
                  {search || branchId
                    ? 'لا توجد منتجات مطابقة للفلتر الحالي — جرّب تغيير الفرع أو البحث'
                    : 'لا توجد منتجات متاحة حاليًا'}
                </p>
                {(search || branchId) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSearch('');
                      if (!branchEmployee) setBranchId('');
                    }}
                  >
                    مسح الفلاتر
                  </Button>
                )}
              </div>
            ) : (
              <>
                <DataTable
                  columns={columns}
                  data={rows}
                  keyExtractor={(p) => `${p.branchId ?? 'all'}-${p.id}`}
                />
                <div className="px-4 pb-4">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={(p) => void load(p, { branchId, search: search.trim() })}
                  />
                </div>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
