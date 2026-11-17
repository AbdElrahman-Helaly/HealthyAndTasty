import { useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { loyaltyApi, type LoyaltySettings } from '@/api/loyalty.api';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import { LoyaltyError, LoyaltyResult } from './LoyaltyComponents';
import { isForbidden, useLoyaltyQuery } from './useLoyaltyQuery';

const earningFields = [
  { key: 'egpPerPoint', step: 'any' },
  { key: 'redemptionValue', step: 'any' },
  { key: 'minimumRedemptionPoints', step: 1 },
  { key: 'maximumRedemptionPercent', step: 'any', max: 100 },
  { key: 'expirationDays', step: 1 },
  { key: 'expiryNoticeDays', step: 1, allowZero: true },
] as const;
const dailyExpiration = { key: 'dailyExpirationDays', step: 1 } as const;
const numericFields = [...earningFields, dailyExpiration];
const earningToggles = ['enabled', 'earnOnDelivery', 'earnOnRedeemedAmount'] as const;

function parseDailyPoints(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length && parsed.every((points) => Number.isSafeInteger(points) && points >= 0)) {
      return parsed.map(String);
    }
  } catch {
    // Fall back to the default cycle when no usable cycle is configured.
  }
  return [2, 3, 5, 5, 7, 8, 20].map(String);
}

function SettingsForm({ settings, canManage, onSaved }: {
  settings: LoyaltySettings;
  canManage: boolean;
  onSaved: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { show } = useToast();
  const [dailyPoints, setDailyPoints] = useState(() => parseDailyPoints(settings.dailyPointsJson));
  const [validation, setValidation] = useState<string[]>([]);
  const [error, setError] = useState<{ cause: unknown }>();
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const editable = canManage && !isForbidden(error?.cause);
  const dayPoints = dailyPoints.map((value) => value === '' ? NaN : Number(value));
  const validCycle = dayPoints.every((value) => Number.isSafeInteger(value) && value >= 0);
  const cycleTotal = validCycle
    ? new Intl.NumberFormat(i18n.language).format(dayPoints.reduce((total, points) => total + points, 0))
    : '—';
  const toggle = (key: typeof earningToggles[number] | 'dailyEnabled') => (
    <label key={key} className="flex items-center gap-2 text-sm font-medium text-on-surface">
      <input name={key} type="checkbox" defaultChecked={settings[key]} className="h-4 w-4 accent-primary" />
      {t(`loyalty.${key}`)}
    </label>
  );
  const numericInput = (field: typeof numericFields[number]) => (
    <Input
      key={field.key}
      name={field.key}
      label={t(`loyalty.${field.key}`)}
      type="number"
      required
      min={'allowZero' in field ? 0 : undefined}
      max={'max' in field ? field.max : undefined}
      step={field.step}
      defaultValue={settings[field.key]}
    />
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable || inFlight.current) return;
    const form = new FormData(event.currentTarget);
    const timeZone = String(form.get('timeZone') ?? '').trim();
    const issues: string[] = [];
    const payload = {
      ...settings,
      enabled: form.has('enabled'),
      earnOnDelivery: form.has('earnOnDelivery'),
      earnOnRedeemedAmount: form.has('earnOnRedeemedAmount'),
      dailyEnabled: form.has('dailyEnabled'),
      timeZone,
      dailyPointsJson: JSON.stringify(dayPoints),
    };

    for (const field of numericFields) {
      const input = form.get(field.key);
      const value = typeof input === 'string' && input.trim() ? Number(input) : NaN;
      const minimum = 'allowZero' in field ? 0 : Number.MIN_VALUE;
      const maximum = 'max' in field ? field.max : Infinity;
      if (!Number.isFinite(value) || value < minimum || value > maximum
        || (field.step === 1 && !Number.isSafeInteger(value))) {
        issues.push(t('loyalty.settingsInvalid', { field: t(`loyalty.${field.key}`) }));
      }
      payload[field.key] = value;
    }
    if (!timeZone) issues.push(t('loyalty.timeZoneRequired'));
    if (!validCycle) issues.push(t('loyalty.invalidCycle'));
    setValidation(issues);
    setError(undefined);
    if (issues.length) return;

    inFlight.current = true;
    setSaving(true);
    try {
      await loyaltyApi.saveSettings(payload);
      show(t('loyalty.settingsSaved'), 'success');
      onSaved();
    } catch (cause) {
      setError({ cause });
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void save(event)} noValidate>
      {!canManage && <p className="text-sm text-on-surface-variant">{t('loyalty.settingsReadOnly')}</p>}
      <fieldset className="space-y-4" disabled={!editable || saving}>
        <Card className="space-y-4">
          <CardTitle>{t('loyalty.earningAndRedemption')}</CardTitle>
          <div className="flex flex-wrap gap-x-6 gap-y-3">{earningToggles.map(toggle)}</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {earningFields.map(numericInput)}
            <Input name="timeZone" label={t('loyalty.timeZone')} defaultValue={settings.timeZone || 'Africa/Cairo'} required />
          </div>
        </Card>
        <Card className="space-y-4">
          <CardTitle>{t('loyalty.dailyRewards')}</CardTitle>
          {toggle('dailyEnabled')}
          <div className="max-w-xs">{numericInput(dailyExpiration)}</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {dailyPoints.map((value, index) => (
              <Input
                key={index}
                label={t('loyalty.cycleDay', { day: index + 1 })}
                type="number"
                min={0}
                step={1}
                required
                value={value}
                onChange={(event) => {
                  const next = event.target.value;
                  setDailyPoints((points) => points.map((point, day) => day === index ? next : point));
                }}
              />
            ))}
          </div>
          <p className="text-sm font-semibold text-primary">{t('loyalty.cycleTotal', { points: cycleTotal })}</p>
        </Card>
      </fieldset>
      {validation.length > 0 && (
        <ul role="alert" className="list-disc space-y-1 rounded-xl bg-error/10 p-3 ps-8 text-sm text-error">
          {validation.map((issue) => <li key={issue}>{issue}</li>)}
        </ul>
      )}
      {error && <LoyaltyError error={error.cause} />}
      {editable && <Button type="submit" loading={saving}>{t('common.save')}</Button>}
    </form>
  );
}

export function LoyaltySettingsPanel({ canManage }: { canManage: boolean }) {
  const query = useLoyaltyQuery(loyaltyApi.settings);
  return (
    <LoyaltyResult query={query}>
      {(settings) => settings
        ? <SettingsForm settings={settings} canManage={canManage} onSaved={query.retry} />
        : <EmptySettings />}
    </LoyaltyResult>
  );
}

function EmptySettings() {
  const { t } = useTranslation();
  return <Card>{t('loyalty.noSettings')}</Card>;
}
