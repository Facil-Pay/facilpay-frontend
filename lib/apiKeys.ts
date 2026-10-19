/**
 * API Keys Management and Generator Utility.
 * Supports publishable keys (pk_test_..., pk_live_...) and secret keys (sk_test_..., sk_live_...),
 * resource-level permissions, key rolling with grace periods, and revocation.
 */

export type NetworkMode = 'testnet' | 'mainnet';

export type KeyStatus = 'active' | 'revoked' | 'rolling' | 'expired';

export interface ResourcePermission {
  read: boolean;
  write: boolean;
}

export interface KeyPermissions {
  type: 'full_access' | 'restricted';
  resources: {
    payments: ResourcePermission;
    refunds: ResourcePermission;
    webhooks: ResourcePermission;
    escrow: ResourcePermission;
  };
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  fullKey?: string; // Only populated at creation time
  network: NetworkMode;
  createdDate: string; // ISO 8601
  lastUsed: string | null;
  createdBy: string;
  status: KeyStatus;
  permissions: KeyPermissions;
  expiresAt: string | null;
  rollingExpiresAt?: string | null;
  gracePeriod?: 'now' | '1h' | '24h' | '7d' | null;
}

export const PUBLISHABLE_KEYS: Record<NetworkMode, string> = {
  testnet: 'pk_test_facilpay_9f8a2c1b84e72026testnet',
  mainnet: 'pk_live_facilpay_3d4e5f6a7b8c2026mainnet',
};

/**
 * Generates a random cryptographically random-like hex string.
 */
function randomHex(length = 24): string {
  const chars = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Generates a new secret key string with appropriate environment prefix.
 */
export function generateSecretKeyString(network: NetworkMode): string {
  const prefix = network === 'testnet' ? 'sk_test_' : 'sk_live_';
  return `${prefix}${randomHex(32)}`;
}

/**
 * Masks a secret key for display, showing only the prefix and leading 8 characters.
 */
export function maskSecretKey(fullKey: string): string {
  if (!fullKey) return '';
  const prefix = fullKey.slice(0, 16);
  return `${prefix}••••••••••••••••••••••••`;
}

export const DEFAULT_PERMISSIONS: KeyPermissions = {
  type: 'full_access',
  resources: {
    payments: { read: true, write: true },
    refunds: { read: true, write: true },
    webhooks: { read: true, write: true },
    escrow: { read: true, write: true },
  },
};

export const INITIAL_API_KEYS: ApiKeyItem[] = [
  {
    id: 'key_testnet_server_01',
    name: 'Primary Backend Integration',
    keyPrefix: 'sk_test_9f8a2c1b84e7...',
    network: 'testnet',
    createdDate: '2026-01-15T10:00:00.000Z',
    lastUsed: '2026-02-28T16:45:12.000Z',
    createdBy: 'alex@facilpay.io',
    status: 'active',
    permissions: {
      type: 'full_access',
      resources: {
        payments: { read: true, write: true },
        refunds: { read: true, write: true },
        webhooks: { read: true, write: true },
        escrow: { read: true, write: true },
      },
    },
    expiresAt: null,
  },
  {
    id: 'key_testnet_webhooks_02',
    name: 'Webhook Event Dispatcher',
    keyPrefix: 'sk_test_3b4c5d6e7f8a...',
    network: 'testnet',
    createdDate: '2026-02-01T14:20:00.000Z',
    lastUsed: '2026-02-27T08:10:00.000Z',
    createdBy: 'devin@facilpay.io',
    status: 'active',
    permissions: {
      type: 'restricted',
      resources: {
        payments: { read: true, write: false },
        refunds: { read: true, write: false },
        webhooks: { read: true, write: true },
        escrow: { read: false, write: false },
      },
    },
    expiresAt: '2026-12-31T23:59:59.000Z',
  },
  {
    id: 'key_live_prod_01',
    name: 'Mainnet Production Gateway',
    keyPrefix: 'sk_live_7a8b9c0d1e2f...',
    network: 'mainnet',
    createdDate: '2026-02-10T12:00:00.000Z',
    lastUsed: '2026-02-28T18:00:00.000Z',
    createdBy: 'alex@facilpay.io',
    status: 'active',
    permissions: {
      type: 'full_access',
      resources: {
        payments: { read: true, write: true },
        refunds: { read: true, write: true },
        webhooks: { read: true, write: true },
        escrow: { read: true, write: true },
      },
    },
    expiresAt: null,
  },
];

const API_KEYS_STORAGE_KEY = 'facilpay_api_keys_storage';

export function getStoredApiKeys(): ApiKeyItem[] {
  if (typeof window === 'undefined') return INITIAL_API_KEYS;
  try {
    const raw = window.localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (!raw) return INITIAL_API_KEYS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_API_KEYS;
  } catch {
    return INITIAL_API_KEYS;
  }
}

export function saveStoredApiKeys(keys: ApiKeyItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // Ignore storage quota errors
  }
}
