import { useRef, useState } from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/lib/apiClient';
import { replyToOrderRating } from '@/api/orders.api';
import type { DashboardOrderDetail } from '@/types';

export function OrderRating({ order, onSaved }: { order: DashboardOrderDetail; onSaved: (order: DashboardOrderDetail) => void }) {
  const { user } = useAuth();
  const { show } = useToast();
  const [reply, setReply] = useState(order.adminReply ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const canReply = ['admin', 'generalmanager', 'branchmanager', 'branchemployee'].includes(user?.role.toLowerCase() ?? '');
  const save = async () => {
    if (pending.current) return;
    if (!reply.trim() || reply.length > 1000) { setError('اكتب ردًا من حرف واحد إلى 1000 حرف'); return; }
    pending.current = true; setSaving(true); setError('');
    try {
      const updated = await replyToOrderRating(order.id, reply.trim());
      onSaved(updated); setReply(updated.adminReply ?? ''); show('تم حفظ الرد على التقييم', 'success');
    } catch (err) { setError(err instanceof ApiError ? [err.message, ...err.errors].join('، ') : 'تعذر حفظ الرد'); }
    finally { pending.current = false; setSaving(false); }
  };
  return <section dir="rtl" className="border-y border-outline-variant/40 py-4 text-sm">
    <h3 className="mb-3 font-semibold">تقييم الطلب</h3>
    {order.rating == null ? <p>لم يتم تقييم الطلب</p> : <div className="flex flex-col gap-3">
      <p>التقييم: {order.rating}</p>
      {order.ratingComment && <p className="whitespace-pre-wrap break-words">{order.ratingComment}</p>}
      {order.ratedAt && <p>تاريخ التقييم: {new Date(order.ratedAt).toLocaleString('ar-EG')}</p>}
      {order.adminReply && <div className="border-s-2 border-primary ps-3"><p className="font-semibold">الرد الحالي</p><p className="whitespace-pre-wrap break-words">{order.adminReply}</p>{order.adminRepliedAt && <p>تاريخ الرد: {new Date(order.adminRepliedAt).toLocaleString('ar-EG')}</p>}{order.adminRepliedBy != null && <p>بواسطة: {order.adminRepliedBy}</p>}</div>}
      {canReply && <form className="flex flex-col gap-3" onSubmit={event => { event.preventDefault(); void save(); }}><Textarea label="الرد على التقييم" maxLength={1000} disabled={saving} value={reply} onChange={event => setReply(event.target.value)} /><p className="text-xs text-on-surface-variant">{reply.length} / 1000</p>{error && <p role="alert" className="text-error">{error}</p>}<div><Button type="submit" loading={saving}>حفظ الرد</Button></div></form>}
    </div>}
  </section>;
}
