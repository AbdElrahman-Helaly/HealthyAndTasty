import { ApiImage } from '@/components/ui/ApiImage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight, MapPin, CreditCard, Package, ReceiptText, Tag, Truck, CircleDashed,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getOrderDetail, updateOrderStatus } from '@/api/orders.api';
import { orderStatusConfig, formatCurrency } from '@/config/orderStatus';
import { ORDER_STATUS, type DashboardOrderDetail, type OrderStatusNumber } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/hooks/useToast';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OrderDetailsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { show: showToast } = useToast();
  const [order, setOrder] = useState<DashboardOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newStatus, setNewStatus] = useState<OrderStatusNumber | ''>('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  usePageTitle(t('orders.detailsTitle'));

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await getOrderDetail(id);
      setOrder(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الطلب');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusOptions = useMemo(
    () => [
      { value: '', label: 'اختر الحالة الجديدة' },
      ...Object.entries(ORDER_STATUS).map(([, num]) => ({
        value: String(num),
        label: orderStatusConfig(num as OrderStatusNumber).label,
      })),
    ],
    [],
  );

  async function handleStatusChange() {
    if (!order || newStatus === '') return;
    setIsSaving(true);
    try {
      const updated = await updateOrderStatus(order.id, { newStatus: newStatus as OrderStatusNumber, note: note || undefined });
      setOrder(updated);
      setNewStatus('');
      setNote('');
      showToast('تم تحديث حالة الطلب بنجاح', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشل تحديث حالة الطلب', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-80 skeleton rounded-2xl" />
          <div className="h-80 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <PageHeader title={t('orders.detailsTitle')} subtitle={t('orders.detailsSubtitle')} />
        <Card padding="xl">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-base font-medium text-on-surface-variant">{error || 'الطلب غير موجود'}</p>
            <Button variant="secondary" className="mt-4" onClick={() => navigate('/orders')}>
              العودة للطلبات
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const statusCfg = orderStatusConfig(order.statusNumber);
  const discount = order.discount || 0;

  return (
    <div>
      <PageHeader
        title={`الطلب ${order.orderNumber}`}
        subtitle={t('orders.detailsSubtitle')}
        actions={
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => navigate('/orders')}>
            <ArrowRight className="h-4 w-4" />
            العودة
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Summary */}
          <Card padding="xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-on-surface">{order.customerName}</h3>
                  <span className={statusCfg.className}>{statusCfg.label}</span>
                </div>
                <p className="text-sm text-on-surface-variant/70 mt-1" dir="ltr">{order.customerPhone}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-on-surface-variant/60">إجمالي الطلب</span>
                <span className="text-2xl font-bold tabular-nums text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-surface text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-on-surface-variant/60">العنوان</p>
                  <p className="text-sm font-medium text-on-surface truncate">{order.deliveryAddress || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-surface text-primary">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] text-on-surface-variant/60">طريقة الدفع</p>
                  <p className="text-sm font-medium text-on-surface">{order.paymentMethod || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-surface text-primary">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] text-on-surface-variant/60">الفرع</p>
                  <p className="text-sm font-medium text-on-surface">{order.branchName}</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="border-y border-outline-variant/40 py-4 text-sm">
            {order.deliveryEstimate ? <>
              <p className="font-semibold">مدة التوصيل: {order.deliveryEstimate.value} {{ minutes: 'دقيقة', hours: 'ساعة', days: 'يوم' }[order.deliveryEstimate.unit]}</p>
              <p className="mt-2">موعد الوصول المتوقع: <time dateTime={order.deliveryEstimate.estimatedDeliveryAt}>{new Date(order.deliveryEstimate.estimatedDeliveryAt).toLocaleString('ar-EG')}</time></p>
              <p className="mt-2 text-xs text-on-surface-variant">تقدير ثابت من وقت إنشاء الطلب. لا يمثل تتبعًا مباشرًا للمندوب.</p>
            </> : <p>مدة التوصيل غير محددة</p>}
          </div>

          {/* Items */}
          <Card padding="xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-surface text-primary">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-on-surface">المنتجات</h3>
                <p className="text-[11px] text-on-surface-variant/60 mt-0.5">{order.items.length} منتج</p>
              </div>
            </div>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-start py-3 px-3 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">المنتج</th>
                    <th className="text-start py-3 px-3 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">السعر</th>
                    <th className="text-start py-3 px-3 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">الكمية</th>
                    <th className="text-start py-3 px-3 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.productId} className="border-b border-gray-50 hover:bg-primary-surface/30 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <ApiImage src={item.image} alt={item.productName} className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-surface text-primary">
                              <Package className="h-4 w-4" />
                            </div>
                          )}
                          <span className="font-medium text-on-surface">{item.productName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-on-surface-variant/70">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3.5 px-3 text-on-surface-variant/70">{item.quantity}</td>
                      <td className="py-3.5 px-3 font-semibold text-on-surface">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex flex-col items-end gap-1.5 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between gap-12 text-sm">
                <span className="text-on-surface-variant/70">المجموع الفرعي</span>
                <span className="text-on-surface">{formatCurrency(order.subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between gap-12 text-sm">
                  <span className="text-on-surface-variant/70">الخصم</span>
                  <span className="text-red-500">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-12 text-sm">
                <span className="text-on-surface-variant/70">رسوم التوصيل</span>
                <span className="text-on-surface">{formatCurrency(order.deliveryFee)}</span>
              </div>
              <div className="flex items-center justify-between gap-12 pt-2 border-t border-gray-100">
                <span className="font-semibold text-on-surface">الإجمالي</span>
                <span className="font-bold text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-4">
          {/* Status update */}
          <Card padding="xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-surface text-primary">
                <ReceiptText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-on-surface">تحديث الحالة</h3>
                <p className="text-[11px] text-on-surface-variant/60 mt-0.5">الحالات المتاحة: {order.availableStatuses.length}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Select value={newStatus === '' ? '' : String(newStatus)} onChange={(e) => setNewStatus(e.target.value ? Number(e.target.value) as OrderStatusNumber : '')}>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
              <Input placeholder="ملاحظة (اختياري)" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button loading={isSaving} disabled={newStatus === ''} onClick={() => void handleStatusChange()}>
                حفظ الحالة
              </Button>
            </div>
          </Card>

          {/* History */}
          <Card padding="xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-surface text-primary">
                <CircleDashed className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-on-surface">سجل الحالات</h3>
                <p className="text-[11px] text-on-surface-variant/60 mt-0.5">تغيرات حالة الطلب</p>
              </div>
            </div>
            {order.history.length === 0 ? (
              <p className="text-sm text-on-surface-variant/60 py-4 text-center">لا يوجد سجل بعد</p>
            ) : (
              <div className="flex flex-col">
                {order.history.map((h, i) => (
                  <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < order.history.length - 1 && (
                      <span className="absolute start-[7px] top-5 bottom-0 w-px bg-gray-100" />
                    )}
                    <span className="relative mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                      <span className="h-3 w-3 rounded-full bg-primary" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-on-surface">
                        {h.fromStatus} ← {h.toStatus}
                      </p>
                      {h.note && <p className="text-xs text-on-surface-variant/70 mt-0.5">{h.note}</p>}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-on-surface-variant/50">{h.changedByRole}</span>
                        <span className="text-on-surface-variant/20">•</span>
                        <span className="text-[10px] text-on-surface-variant/50">{formatDate(h.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Meta */}
          <Card padding="xl">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-surface text-primary">
                <Tag className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-on-surface">معلومات إضافية</h3>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant/60">رقم Odoo</span>
                <span className="font-medium text-on-surface">#{order.odooOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant/60">كود الخصم</span>
                <span className="font-medium text-on-surface">{order.couponCode || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant/60">عدد المنتجات</span>
                <span className="font-medium text-on-surface">{order.itemsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant/60">تاريخ الإنشاء</span>
                <span className="font-medium text-on-surface">{formatDate(order.createdAt)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
