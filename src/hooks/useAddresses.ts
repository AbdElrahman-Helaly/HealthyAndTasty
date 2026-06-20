import { useCallback, useState } from 'react';
import {
  createAddress,
  deleteAddress,
  getAddressById,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from '@/services/address.service';
import { useAsync } from './useAsync';
import type { Address, CreateAddressRequest, UpdateAddressRequest } from '@/types';

// ---------------------------------------------------------------------------
// useAddresses — full list with CRUD helpers
// ---------------------------------------------------------------------------

export interface UseAddressesReturn {
  addresses: Address[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  createAddress: (payload: CreateAddressRequest) => Promise<Address>;
  updateAddress: (id: string, payload: UpdateAddressRequest) => Promise<Address>;
  deleteAddress: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
}

export function useAddresses(): UseAddressesReturn {
  const { data, isLoading, error, refetch } = useAsync(getAddresses, []);

  const [, setTick] = useState(0);
  const triggerRefetch = useCallback(() => {
    refetch();
    setTick((t) => t + 1);
  }, [refetch]);

  const handleCreate = useCallback(
    async (payload: CreateAddressRequest): Promise<Address> => {
      const result = await createAddress(payload);
      triggerRefetch();
      return result;
    },
    [triggerRefetch],
  );

  const handleUpdate = useCallback(
    async (id: string, payload: UpdateAddressRequest): Promise<Address> => {
      const result = await updateAddress(id, payload);
      triggerRefetch();
      return result;
    },
    [triggerRefetch],
  );

  const handleDelete = useCallback(
    async (id: string): Promise<void> => {
      await deleteAddress(id);
      triggerRefetch();
    },
    [triggerRefetch],
  );

  const handleSetDefault = useCallback(
    async (id: string): Promise<void> => {
      await setDefaultAddress(id);
      triggerRefetch();
    },
    [triggerRefetch],
  );

  return {
    addresses: data ?? [],
    loading: isLoading,
    error,
    refetch: triggerRefetch,
    createAddress: handleCreate,
    updateAddress: handleUpdate,
    deleteAddress: handleDelete,
    setDefault: handleSetDefault,
  };
}

// ---------------------------------------------------------------------------
// useAddressDetails — single address fetch
// ---------------------------------------------------------------------------

export function useAddressDetails(id: string | undefined): {
  data: Address | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useAsync(
    () => (id ? getAddressById(id) : Promise.resolve(null)),
    [id],
  );
}
