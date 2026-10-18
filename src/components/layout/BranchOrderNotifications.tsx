import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { http, ApiError } from '@/lib/apiClient';
import { useLiveOrders } from '@/hooks/useLiveOrders';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface Notification { id: string; title: string; body: string; targetUrl: string; createdAt: string }
export const BRANCH_ORDER_CREATED = 'branch-order-created';
export function BranchOrderNotifications() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sound, setSound] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const request = useRef(0);
  const busy = useRef(false);
  const soundEnabled = useRef(false);
  const seenOrders = useRef(new Set<number>());
  const load = useCallback(async (next: number) => {
    if (next !== 1 && busy.current) return;
    const version = ++request.current;
    busy.current = true; setLoading(true); setError('');
    try {
      const result = await http.get<Notification[]>('/api/v1/notifications/branch-orders', { params: { page: next, pageSize: 20 } });
      if (version !== request.current) return;
      setItems(previous => [...new Map((next === 1 ? result : [...previous, ...result]).map(item => [item.id, item])).values()]);
      setPage(next); setMore(result.length === 20);
    } catch (err) {
      if (version === request.current) setError(err instanceof ApiError ? [err.message, ...err.errors].join('، ') : 'تعذر تحميل الإشعارات');
    } finally {
      if (version === request.current) { busy.current = false; setLoading(false); }
    }
  }, []);
  const play = () => {
    const context = audio.current;
    if (!soundEnabled.current || !context || context.state !== 'running') return;
    // A soft, bell-like tri-tone inspired by phone notification chimes.
    const notes = [1318.51, 1567.98, 2093.0];
    for (let index = 0; index < notes.length; index++) {
      for (const harmonic of [1, 2]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * 0.13;
      oscillator.type = 'sine';
      oscillator.frequency.value = notes[index] * harmonic;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(harmonic === 1 ? 0.3 : 0.045, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(start); oscillator.stop(start + 0.72);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      }
    }
  };
  useLiveOrders(event => {
    if (event.type !== 'created') return;
    void load(1);
    window.dispatchEvent(new Event(BRANCH_ORDER_CREATED));
    if (!seenOrders.current.has(event.order.id)) {
      seenOrders.current.add(event.order.id);
      if (seenOrders.current.size > 200) seenOrders.current.delete(seenOrders.current.values().next().value!);
      play();
    }
  });
  useEffect(() => {
    void load(1);
    return () => { request.current++; soundEnabled.current = false; void audio.current?.close(); audio.current = null; };
  }, [load]);
  const toggleSound = async () => {
    if (soundEnabled.current) { soundEnabled.current = false; setSound(false); return; }
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      soundEnabled.current = true; setSound(true); play();
    } catch { setError('تعذر تشغيل الصوت. تحقق من سماح المتصفح بالصوت.'); }
  };
  const content = <div dir="rtl" className="flex min-h-0 flex-col gap-2">
    <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">إشعارات أوردرات الفروع</span><Button variant="ghost" size="icon" title={sound ? 'إيقاف صوت التنبيه' : 'تفعيل صوت التنبيه'} aria-label={sound ? 'إيقاف صوت التنبيه' : 'تفعيل صوت التنبيه'} aria-pressed={sound} onClick={() => void toggleSound()}>{sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</Button></div>
    {error && <div role="alert" className="text-sm text-error">{error}<Button variant="ghost" onClick={() => void load(page || 1)}>إعادة المحاولة</Button></div>}
    <div className="max-h-[55vh] overflow-y-auto">{items.map(item => {
      const path = `/${item.targetUrl.replace(/^\/+/, '')}`;
      const valid = /^\/orders\/\d+\/?$/.test(path);
      return <button type="button" key={item.id} disabled={!valid} className="block w-full border-b border-outline-variant/40 p-3 text-start hover:bg-surface-container disabled:cursor-default" onClick={() => { setOpen(false); setFull(false); navigate(path); }}><p className="text-sm font-semibold break-words">{item.title}</p><p className="mt-1 text-sm break-words">{item.body}</p><time dateTime={item.createdAt} className="mt-1 block text-xs text-on-surface-variant">{new Date(item.createdAt).toLocaleString('ar-EG')}</time></button>;
    })}</div>
    {loading && <p role="status" className="p-3 text-sm">جاري تحميل الإشعارات...</p>}
    {!loading && !error && !items.length && <p className="p-5 text-center text-sm">لا توجد إشعارات أوردرات جديدة</p>}
    {more && <Button variant="secondary" loading={loading} onClick={() => void load(page + 1)}>تحميل المزيد</Button>}
    {!full && <Button variant="ghost" onClick={() => { setOpen(false); setFull(true); }}>عرض القائمة الكاملة</Button>}
  </div>;
  return <>
    <Button variant="ghost" size="icon" title="إشعارات أوردرات الفروع" aria-label="إشعارات أوردرات الفروع" aria-expanded={open} onClick={() => setOpen(value => !value)}><Bell className="h-[18px] w-[18px]" /></Button>
    {open && <><button className="fixed inset-0 z-30 cursor-default" aria-label="إغلاق الإشعارات" onClick={() => setOpen(false)} /><section aria-label="إشعارات أوردرات الفروع" className="absolute top-16 end-2 z-40 w-[calc(100vw-1rem)] max-w-md rounded-lg border border-outline-variant bg-surface p-3 shadow-xl">{content}</section></>}
    {full && <Modal open title="إشعارات أوردرات الفروع" onClose={() => setFull(false)} size="lg">{content}</Modal>}
  </>;
}
