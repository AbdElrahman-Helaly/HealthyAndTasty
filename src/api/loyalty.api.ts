import { http } from '@/lib/apiClient';
import type { PagedResult } from '@/types';

export interface LoyaltySettings {
  id: number | string;
  earnOrdersFromUtc: string | null;
  enabled: boolean;
  egpPerPoint: number;
  redemptionValue: number;
  minimumRedemptionPoints: number;
  maximumRedemptionPercent: number;
  expirationDays: number;
  earnOnDelivery: boolean;
  earnOnRedeemedAmount: boolean;
  dailyEnabled: boolean;
  dailyExpirationDays: number;
  timeZone: string;
  expiryNoticeDays: number;
  dailyPointsJson: string;
}

export interface LoyaltyWallet {
  availablePoints: number;
  pendingPoints: number;
  totalEarnedPoints: number;
  totalRedeemedPoints: number;
  debtPoints: number;
  monetaryEquivalent: number;
  currency: string;
}

export interface LoyaltyTransaction {
  id?: number | string;
  createdAt: string;
  type: string;
  points: number;
  monetaryEquivalent: number | null;
  status: string;
  description: string | null;
  referenceType: string | null;
  referenceId: number | string | null;
  expiresAt: string | null;
}

export interface WalletAdjustment {
  points: number;
  reason: string;
  requestId: string;
}

export interface LoyaltyStatistics {
  wallets: number;
  availablePoints: number;
  totalEarned: number;
  totalRedeemed: number;
  claims: number;
}

export interface DailyClaim {
  customerId: number | string;
  claimDate: string;
  streakDay: number;
  rewardPoints: number;
  loyaltyTransactionId: number | string | null;
  createdAt: string;
}

type LoyaltyPage<T> = Pick<PagedResult<T>, 'items' | 'totalCount' | 'page' | 'pageSize'>;

const base = '/api/admin/loyalty';
const customerPath = (id: string) => `${base}/customers/${encodeURIComponent(id)}`;
const pageSize = 20;

export const loyaltyApi = {
  settings: () => http.get<LoyaltySettings>(`${base}/settings`),
  saveSettings: (settings: LoyaltySettings) => http.put<unknown>(`${base}/settings`, settings),
  wallet: (customerId: string) => http.get<LoyaltyWallet>(customerPath(customerId)),
  transactions: (customerId: string, page: number) =>
    http.get<LoyaltyPage<LoyaltyTransaction>>(`${customerPath(customerId)}/transactions`, {
      params: { page, pageSize },
    }),
  adjustWallet: (customerId: string, adjustment: WalletAdjustment) =>
    http.post<unknown>(`${customerPath(customerId)}/adjustments`, adjustment),
  statistics: () => http.get<LoyaltyStatistics>(`${base}/statistics`),
  dailyClaims: (customerId: string, page: number) =>
    http.get<LoyaltyPage<DailyClaim>>('/api/admin/rewards/daily/claims', {
      params: { customerId: customerId || undefined, page, pageSize },
    }),
  confirmCashCollected: (orderId: number) =>
    http.post<unknown>(`${base}/orders/${encodeURIComponent(String(orderId))}/cash-collected`),
};
