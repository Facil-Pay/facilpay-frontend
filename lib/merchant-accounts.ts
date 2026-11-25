/**
 * lib/merchant-accounts.ts
 *
 * Multi-store merchant account switching (Issue #133).
 *
 * This app has no backend concept of multiple merchant accounts per user
 * yet, so the accessible-business list is mocked here. The active account
 * id is the one piece of real client state: it is persisted to localStorage
 * and read by the API client so every request is scoped to it.
 */

export interface MerchantAccount {
  id: string;
  name: string;
}

export const MERCHANT_ACCOUNTS: MerchantAccount[] = [
  { id: 'merch_facilpay_01', name: 'Northstar Goods' },
  { id: 'merch_facilpay_02', name: 'RetailEdge Lagos' },
  { id: 'merch_facilpay_03', name: 'Lumen Books' },
];

const ACTIVE_MERCHANT_KEY = 'facilpay_active_merchant_id';

function isKnownAccount(id: string | null): id is string {
  return !!id && MERCHANT_ACCOUNTS.some((a) => a.id === id);
}

/** Safe for SSR: returns the default account id until the client reads localStorage. */
export function getActiveMerchantId(): string {
  const fallback = MERCHANT_ACCOUNTS[0].id;
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = window.localStorage.getItem(ACTIVE_MERCHANT_KEY);
    return isKnownAccount(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

export function setActiveMerchantId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTIVE_MERCHANT_KEY, id);
  } catch {
    // Storage unavailable (private mode) — selection just won't survive reload.
  }
}

export function getActiveMerchantAccount(): MerchantAccount {
  const id = getActiveMerchantId();
  return MERCHANT_ACCOUNTS.find((a) => a.id === id) ?? MERCHANT_ACCOUNTS[0];
}
