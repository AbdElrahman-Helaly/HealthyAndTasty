import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getLiveOrders } from '@/api/orders.api';
import { useLiveOrders } from '@/hooks/useLiveOrders';
import { orderStatusConfig, formatCurrency } from '@/config/orderStatus';
import type { DashboardOrderListItem, LiveOrdersColumn } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';

function OrderCard({ order, onOpen }: { order: DashboardOrderListItem; onOpen: (order: DashboardOrderListItem) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onOpen(order)}
      className="cursor-pointer rounded-xl border border-outline-variant/30 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-on-surface">{order.orderNumber}</p>
        <span className="text-[10px] text-on-surface-variant/50">{order.itemsCount} منتج</span>
      </div>
      <p className="mt-1 text-sm font-medium text-on-surface truncate">{order.customerName}</p>
      <p className="text-[11px] text-on-surface-variant/60 truncate" dir="ltr">{order.customerPhone}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-on-surface-variant/60 truncate">{order.branchName}</span>
        <span className="text-sm font-bold text-primary">{formatCurrency(order.total)}</span>
      </div>
    </motion.div>
  );
}

export function LiveOrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [columns, setColumns] = useState<LiveOrdersColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  usePageTitle(t('liveOrders.title'));

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const board = await getLiveOrders();
      setColumns(board.columns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الطلبات المباشرة');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // SignalR — live updates
  const { connected } = useLiveOrders((event) => {
    setColumns((prev) => {
      if (!prev.length) return prev;
      const next = prev.map((col) => ({
        ...col,
        orders: col.orders.filter((o) => o.id !== event.order.id),
      }));
      const target = next.find((col) => col.statusNumber === event.order.statusNumber);
      if (target) {
        return next.map((col) =>
          col.statusNumber === event.order.statusNumber
            ? { ...col, orders: [event.order, ...col.orders] }
            : col,
        );
      }
      return next;
    });
  });

  const handleOpen = useCallback(
    (order: DashboardOrderListItem) => {
      navigate(`/orders/${order.id}`);
    },
    [navigate],
  );

  const totalCount = columns.reduce((s, c) => s + c.orders.length, 0);

  return (
    <div>
      <PageHeader
        title={t('liveOrders.title')}
        subtitle={t('liveOrders.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            {connected ? (
              <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-success">
                <Wifi className="h-3.5 w-3.5" />
                متصل مباشر
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-on-surface-variant">
                <WifiOff className="h-3.5 w-3.5" />
                غير متصل — تحديث يدوي
              </span>
            )}
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[520px] skeleton rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <Card padding="xl">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-base font-medium text-on-surface-variant">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={() => void load()}>
              إعادة المحاولة
            </Button>
          </div>
        </Card>
      ) : columns.length === 0 ? (
        <Card padding="xl">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Radio className="h-10 w-10 text-on-surface-variant/30" />
            <p className="mt-3 text-base font-medium text-on-surface-variant">لا توجد طلبات مباشرة حالياً</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {columns.map((col) => {
            const cfg = orderStatusConfig(col.statusNumber);
            const pct = totalCount > 0 ? (col.orders.length / totalCount) * 100 : 0;
            return (
              <Card key={col.statusNumber} padding="sm" className="min-h-[320px]">
                <div className="flex items-center justify-between px-2 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <h3 className="text-sm font-bold text-on-surface">{cfg.label}</h3>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">{col.orders.length}</span>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-gray-100 overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                </div>
                <div className="flex flex-col gap-2.5">
                  <AnimatePresence>
                    {col.orders.map((order) => (
                      <OrderCard key={order.id} order={order} onOpen={handleOpen} />
                    ))}
                  </AnimatePresence>
                  {col.orders.length === 0 && (
                    <p className="text-center text-xs text-on-surface-variant/50 py-6">لا توجد طلبات</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
