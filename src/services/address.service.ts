/**
 * Address service — all address-related API calls go through here.
 * Pages and components must never call fetch() directly.
 */
import { api } from '@/lib/api';
import type { Address, CreateAddressRequest, UpdateAddressRequest } from '@/types';

/**
 * Fetch all addresses for the current user.
 */
export async function getAddresses(): Promise<Address[]> {
  return api.addresses.list();
}

/**
 * Fetch a single address by ID.
 */
export async function getAddressById(id: string): Promise<Address | null> {
  return api.addresses.getById(id);
}

/**
 * Create a new address.
 */
export async function createAddress(payload: CreateAddressRequest): Promise<Address> {
  return api.addresses.create(payload);
}

/**
 * Update an existing address.
 */
export async function updateAddress(id: string, payload: UpdateAddressRequest): Promise<Address> {
  return api.addresses.update(id, payload);
}

/**
 * Delete an address permanently.
 */
export async function deleteAddress(id: string): Promise<void> {
  return api.addresses.delete(id);
}

/**
 * Set an address as the default.
 */
export async function setDefaultAddress(id: string): Promise<void> {
  return api.addresses.setDefault(id);
}
