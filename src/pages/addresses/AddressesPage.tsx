import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MapPin, Pencil, Plus, RefreshCw, Star, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSkeleton } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/Modal';
import { FormDrawer } from '@/components/shared/FormDrawer';
import { useAddresses } from '@/hooks/useAddresses';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Address, CreateAddressRequest, UpdateAddressRequest } from '@/types';

// ---------------------------------------------------------------------------
// Form value types
// ---------------------------------------------------------------------------

interface CreateFormValues {
  label: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
  phoneE164: string;
  latitude: string;
  longitude: string;
  setAsDefault: boolean;
}

interface EditFormValues {
  label: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
  phoneE164: string;
  latitude: string;
  longitude: string;
}

// ---------------------------------------------------------------------------
// Skeleton cards for loading state
// ---------------------------------------------------------------------------

function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-outline-variant/40 bg-surface p-5 space-y-3">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-3 w-full" />
          <LoadingSkeleton className="h-3 w-3/4" />
          <LoadingSkeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Address card
// ---------------------------------------------------------------------------

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
  onSetDefault: (address: Address) => void;
  settingDefaultId: string | null;
}

function AddressCard({ address, onEdit, onDelete, onSetDefault, settingDefaultId }: AddressCardProps) {
  const { t } = useTranslation();
  const isSetting = settingDefaultId === address.id;

  return (
    <div className="relative flex flex-col gap-3 rounded-xl border border-outline-variant/40 bg-surface p-5 transition-shadow hover:shadow-md">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate font-semibold text-on-surface">{address.label || '—'}</span>
        </div>
        {address.isDefault && (
          <Badge variant="success">{t('addresses.defaultBadge')}</Badge>
        )}
      </div>

      {/* Address lines */}
      <div className="space-y-0.5 text-sm text-on-surface-variant">
        <p>{address.line1}</p>
        {address.line2 && <p>{address.line2}</p>}
        <p>
          {[address.city, address.region, address.country].filter(Boolean).join(', ')}
          {address.postalCode ? ` ${address.postalCode}` : ''}
        </p>
        {address.phoneE164 && <p>{address.phoneE164}</p>}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 pt-1 border-t border-outline-variant/20">
        {!address.isDefault && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSetDefault(address)}
            loading={isSetting}
            title={t('addresses.setDefault')}
            className="text-xs gap-1"
          >
            <Star className="h-3.5 w-3.5" />
            {t('addresses.setDefault')}
          </Button>
        )}
        <div className="ms-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title={t('common.edit')}
            onClick={() => onEdit(address)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={t('common.delete')}
            className="text-error hover:bg-error/10"
            onClick={() => onDelete(address)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Address Drawer
// ---------------------------------------------------------------------------

interface CreateDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateAddressRequest) => Promise<Address>;
}

function CreateAddressDrawer({ open, onClose, onCreate }: CreateDrawerProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    defaultValues: {
      label: '',
      line1: '',
      line2: '',
      city: '',
      region: '',
      country: '',
      postalCode: '',
      phoneE164: '',
      latitude: '',
      longitude: '',
      setAsDefault: false,
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleClose = () => {
    reset();
    setSubmitError(null);
    onClose();
  };

  const onSubmit = async (values: CreateFormValues) => {
    setSubmitError(null);
    try {
      const payload: CreateAddressRequest = {
        label: values.label,
        line1: values.line1,
        line2: values.line2 || null,
        city: values.city,
        region: values.region,
        country: values.country,
        postalCode: values.postalCode || null,
        phoneE164: values.phoneE164 || null,
        latitude: values.latitude !== '' ? parseFloat(values.latitude) : null,
        longitude: values.longitude !== '' ? parseFloat(values.longitude) : null,
        setAsDefault: values.setAsDefault,
      };
      await onCreate(payload);
      handleClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create address');
    }
  };

  return (
    <FormDrawer
      open={open}
      onClose={handleClose}
      title={t('addresses.addAddress')}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            {submitError && <span className="text-error">{submitError}</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button loading={isSubmitting} onClick={() => void handleSubmit(onSubmit)()}>
              {t('common.create')}
            </Button>
          </div>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void handleSubmit(onSubmit)(); }}>
        <Input
          label={t('addresses.label')}
          {...register('label', { required: t('addresses.label') + ' is required' })}
          error={errors.label?.message}
        />
        <Input
          label={t('addresses.line1')}
          {...register('line1', { required: t('addresses.line1') + ' is required' })}
          error={errors.line1?.message}
        />
        <Input label={t('addresses.line2')} {...register('line2')} />
        <Input
          label={t('addresses.city')}
          {...register('city', { required: t('addresses.city') + ' is required' })}
          error={errors.city?.message}
        />
        <Input label={t('addresses.region')} {...register('region')} />
        <Input
          label={t('addresses.country')}
          {...register('country', { required: t('addresses.country') + ' is required' })}
          error={errors.country?.message}
        />
        <Input label={t('addresses.postalCode')} {...register('postalCode')} />
        <Input label={t('addresses.phoneE164')} {...register('phoneE164')} placeholder="+10001234567" />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('addresses.latitude')} type="number" step="any" {...register('latitude')} />
          <Input label={t('addresses.longitude')} type="number" step="any" {...register('longitude')} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register('setAsDefault')}
            className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/30"
          />
          <span className="text-sm text-on-surface">{t('addresses.setAsDefault')}</span>
        </label>
      </form>
    </FormDrawer>
  );
}

// ---------------------------------------------------------------------------
// Edit Address Drawer
// ---------------------------------------------------------------------------

interface EditDrawerProps {
  address: Address | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, payload: UpdateAddressRequest) => Promise<Address>;
}

function EditAddressDrawer({ address, open, onClose, onUpdate }: EditDrawerProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    values: address
      ? {
          label: address.label,
          line1: address.line1,
          line2: address.line2 ?? '',
          city: address.city,
          region: address.region,
          country: address.country,
          postalCode: address.postalCode ?? '',
          phoneE164: address.phoneE164 ?? '',
          latitude: address.latitude != null ? String(address.latitude) : '',
          longitude: address.longitude != null ? String(address.longitude) : '',
        }
      : undefined,
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleClose = () => {
    reset();
    setSubmitError(null);
    onClose();
  };

  const onSubmit = async (values: EditFormValues) => {
    if (!address) return;
    setSubmitError(null);
    try {
      const payload: UpdateAddressRequest = {
        label: values.label,
        line1: values.line1,
        line2: values.line2 || null,
        city: values.city,
        region: values.region,
        country: values.country,
        postalCode: values.postalCode || null,
        phoneE164: values.phoneE164 || null,
        latitude: values.latitude !== '' ? parseFloat(values.latitude) : null,
        longitude: values.longitude !== '' ? parseFloat(values.longitude) : null,
      };
      await onUpdate(address.id, payload);
      handleClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update address');
    }
  };

  return (
    <FormDrawer
      open={open}
      onClose={handleClose}
      title={t('addresses.editAddress')}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            {submitError && <span className="text-error">{submitError}</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button loading={isSubmitting} onClick={() => void handleSubmit(onSubmit)()}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void handleSubmit(onSubmit)(); }}>
        <Input
          label={t('addresses.label')}
          {...register('label', { required: t('addresses.label') + ' is required' })}
          error={errors.label?.message}
        />
        <Input
          label={t('addresses.line1')}
          {...register('line1', { required: t('addresses.line1') + ' is required' })}
          error={errors.line1?.message}
        />
        <Input label={t('addresses.line2')} {...register('line2')} />
        <Input
          label={t('addresses.city')}
          {...register('city', { required: t('addresses.city') + ' is required' })}
          error={errors.city?.message}
        />
        <Input label={t('addresses.region')} {...register('region')} />
        <Input
          label={t('addresses.country')}
          {...register('country', { required: t('addresses.country') + ' is required' })}
          error={errors.country?.message}
        />
        <Input label={t('addresses.postalCode')} {...register('postalCode')} />
        <Input label={t('addresses.phoneE164')} {...register('phoneE164')} placeholder="+10001234567" />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('addresses.latitude')} type="number" step="any" {...register('latitude')} />
          <Input label={t('addresses.longitude')} type="number" step="any" {...register('longitude')} />
        </div>
      </form>
    </FormDrawer>
  );
}

// ---------------------------------------------------------------------------
// Main AddressesPage
// ---------------------------------------------------------------------------

export function AddressesPage() {
  const { t } = useTranslation();
  usePageTitle(t('addresses.title'));

  const {
    addresses,
    loading,
    error,
    refetch,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefault,
  } = useAddresses();

  // Drawer state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Address | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [defaultError, setDefaultError] = useState<string | null>(null);

  const handleSetDefault = useCallback(
    async (address: Address) => {
      setSettingDefaultId(address.id);
      setDefaultError(null);
      try {
        await setDefault(address.id);
      } catch (err) {
        setDefaultError(err instanceof Error ? err.message : 'Failed to set default');
      } finally {
        setSettingDefaultId(null);
      }
    },
    [setDefault],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAddress(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete address');
      setDeleting(false);
    }
  }, [deleteTarget, deleteAddress]);

  return (
    <div>
      <PageHeader
        title={t('addresses.title')}
        subtitle={t('addresses.subtitle')}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('addresses.addAddress')}
          </Button>
        }
      />

      {/* Error state */}
      {error && !loading && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-sm text-error">{error.message}</p>
            <Button variant="secondary" onClick={refetch}>
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Default set error */}
      {defaultError && (
        <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {defaultError}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && <SkeletonCards count={4} />}

      {/* Empty state */}
      {!loading && !error && addresses.length === 0 && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <MapPin className="h-10 w-10 text-on-surface-variant/40" />
            <p className="text-sm text-on-surface-variant">{t('addresses.notFound')}</p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('addresses.addAddress')}
            </Button>
          </div>
        </Card>
      )}

      {/* Address cards grid */}
      {!loading && !error && addresses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
              onSetDefault={handleSetDefault}
              settingDefaultId={settingDefaultId}
            />
          ))}
        </div>
      )}

      {/* Create Drawer */}
      <CreateAddressDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={createAddress}
      />

      {/* Edit Drawer */}
      <EditAddressDrawer
        key={editTarget?.id}
        address={editTarget}
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        onUpdate={updateAddress}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={() => void handleDeleteConfirm()}
        loading={deleting}
        title={t('common.delete') + ' ' + t('nav.addresses').replace(/s$/, '')}
        message={
          deleteError
            ? `Error: ${deleteError}. Try again?`
            : t('addresses.deleteConfirm')
        }
      />
    </div>
  );
}
