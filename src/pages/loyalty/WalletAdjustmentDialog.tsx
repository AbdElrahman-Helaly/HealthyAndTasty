import { useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { loyaltyApi, type WalletAdjustment } from '@/api/loyalty.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/lib/apiClient';
import type { UserManagement } from '@/types';
import { LoyaltyError } from './LoyaltyComponents';
import { customerLabel } from './loyaltyFormat';
import { isForbidden } from './useLoyaltyQuery';

export function WalletAdjustmentDialog({ customer, requests, onClose, onSaved, onForbidden }: {
  customer: UserManagement;
  requests: Map<string, string>;
  onClose: () => void;
  onSaved: () => void;
  onForbidden: (error: unknown) => void;
}) {
  const { t, i18n } = useTranslation();
  const { show } = useToast();
  const [review, setReview] = useState<Omit<WalletAdjustment, 'requestId'>>();
  const [invalid, setInvalid] = useState(false);
  const [error, setError] = useState<{ cause: unknown }>();
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const amount = Number(data.get('amount'));
    const reason = String(data.get('reason') ?? '').trim();
    if (!Number.isSafeInteger(amount) || amount <= 0 || !reason) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setReview({ points: data.get('operation') === 'debit' ? -amount : amount, reason });
  }

  async function confirm() {
    if (!review || inFlight.current || isForbidden(error?.cause)) return;
    const id = String(customer.id);
    const key = JSON.stringify([id, review.points, review.reason]);
    inFlight.current = true;
    setSaving(true);
    setError(undefined);
    try {
      const requestId = requests.get(key) ?? crypto.randomUUID();
      // Keep the ID if the server might have processed the request before the response was lost.
      requests.set(key, requestId);
      await loyaltyApi.adjustWallet(id, { ...review, requestId });
      requests.delete(key);
      show(t('loyalty.adjustmentSaved'), 'success');
      onSaved();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status >= 400 && cause.status < 500 && cause.status !== 408) {
        requests.delete(key);
      }
      if (isForbidden(cause)) onForbidden(cause);
      setError({ cause });
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  function close() {
    if (!inFlight.current) onClose();
  }

  return (
    <Modal open onClose={close} title={t(review ? 'loyalty.confirmAdjustment' : 'loyalty.adjustWallet')}>
      <form onSubmit={prepare} noValidate className="space-y-4" hidden={Boolean(review)}>
        <Select name="operation" label={t('loyalty.operation')} aria-label={t('loyalty.operation')}>
          <option value="credit">{t('loyalty.credit')}</option>
          <option value="debit">{t('loyalty.debit')}</option>
        </Select>
        <Input name="amount" label={t('loyalty.amount')} type="number" required min={1} step={1} />
        <Textarea name="reason" label={t('loyalty.reason')} aria-label={t('loyalty.reason')} required />
        {invalid && <p role="alert" className="text-sm text-error">{t('loyalty.invalidAdjustment')}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close}>{t('common.cancel')}</Button>
          <Button type="submit">{t('loyalty.review')}</Button>
        </div>
      </form>
      {review && (
        <div className="space-y-4">
          <p className="text-sm text-on-surface">
            {t('loyalty.adjustmentSummary', {
              customer: customerLabel(customer),
              operation: t(review.points < 0 ? 'loyalty.debit' : 'loyalty.credit'),
              points: new Intl.NumberFormat(i18n.language).format(Math.abs(review.points)),
            })}
          </p>
          <p className="break-words text-sm text-on-surface-variant">{review.reason}</p>
          {error && <LoyaltyError error={error.cause} />}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" disabled={saving} onClick={close}>{t('common.cancel')}</Button>
            {!error && <Button variant="secondary" disabled={saving} onClick={() => setReview(undefined)}>{t('common.edit')}</Button>}
            {!isForbidden(error?.cause) && (
              <Button loading={saving} onClick={() => void confirm()}>
                {t(error ? 'loyalty.retry' : 'common.confirm')}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
