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
  /** IP addresses / CIDR ranges allowed to use this key. Empty or undefined = any IP. */
  ipAllowlist?: string[];
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

/**
 * Validates a dotted-quad IPv4 address (0.0.0.0 - 255.255.255.255).
 * Leading zeros are rejected to avoid ambiguous octal-style notations.
 */
export function isValidIPv4(value: string): boolean {
  const parts = value.split('.');
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    if (part.length > 1 && part.startsWith('0')) return false;
    const octet = Number(part);
    return octet >= 0 && octet <= 255;
  });
}

/**
 * Validates an IPv6 address, including compressed (`::`) and IPv4-mapped
 * (`::ffff:192.168.0.1`) notations.
 */
export function isValidIPv6(value: string): boolean {
  if (!value || !value.includes(':')) return false;

  let working = value;
  let embeddedGroups = 0;

  // An embedded IPv4 suffix occupies two of the eight groups.
  if (working.includes('.')) {
    const lastColon = working.lastIndexOf(':');
    if (lastColon === -1) return false;

    const ipv4Part = working.slice(lastColon + 1);
    if (!isValidIPv4(ipv4Part)) return false;

    working = `${working.slice(0, lastColon)}:0`;
    embeddedGroups = 1;
  }

  const segments = working.split('::');
  if (segments.length > 2) return false;

  const parseGroups = (input: string): string[] | null => {
    if (input === '') return [];
    const groups = input.split(':');
    if (groups.some((group) => !/^[0-9a-fA-F]{1,4}$/.test(group))) return null;
    return groups;
  };

  if (segments.length === 2) {
    const left = parseGroups(segments[0]);
    const right = parseGroups(segments[1]);
    if (left === null || right === null) return false;
    // `::` must stand in for at least one group.
    return left.length + right.length + embeddedGroups <= 7;
  }

  const groups = parseGroups(segments[0]);
  if (groups === null) return false;
  return groups.length + embeddedGroups === 8;
}

export interface IpAllowlistValidation {
  valid: boolean;
  /** Normalized value (e.g. lower-cased IPv6, trimmed CIDR prefix). */
  normalized: string;
  error?: string;
}

/**
 * Validates a single allowlist entry: a bare IPv4/IPv6 address or a CIDR range
 * such as `203.0.113.0/24` or `2001:db8::/32`.
 */
export function validateIpAllowlistEntry(raw: string): IpAllowlistValidation {
  const value = raw.trim();
  if (!value) {
    return { valid: false, normalized: value, error: 'Enter an IP address or CIDR range.' };
  }

  const slashIndex = value.indexOf('/');
  if (slashIndex === -1) {
    if (isValidIPv4(value)) return { valid: true, normalized: value };
    if (isValidIPv6(value)) return { valid: true, normalized: value.toLowerCase() };
    return {
      valid: false,
      normalized: value,
      error: `"${value}" is not a valid IPv4 or IPv6 address.`,
    };
  }

  const address = value.slice(0, slashIndex);
  const prefix = value.slice(slashIndex + 1);

  if (!/^\d{1,3}$/.test(prefix)) {
    return { valid: false, normalized: value, error: 'CIDR prefix must be a number (e.g. /24).' };
  }

  const prefixLength = Number(prefix);

  if (isValidIPv4(address)) {
    if (prefixLength > 32) {
      return {
        valid: false,
        normalized: value,
        error: 'IPv4 CIDR prefix must be between 0 and 32.',
      };
    }
    return { valid: true, normalized: `${address}/${prefixLength}` };
  }

  if (isValidIPv6(address)) {
    if (prefixLength > 128) {
      return {
        valid: false,
        normalized: value,
        error: 'IPv6 CIDR prefix must be between 0 and 128.',
      };
    }
    return { valid: true, normalized: `${address.toLowerCase()}/${prefixLength}` };
  }

  return {
    valid: false,
    normalized: value,
    error: `"${address}" is not a valid IPv4 or IPv6 address.`,
  };
}

export interface IpAllowlistParseResult {
  /** Valid, de-duplicated, normalized entries. */
  entries: string[];
  /** Human readable messages for every invalid entry. */
  errors: string[];
}

/**
 * Validates and normalizes a whole allowlist.
 */
export function parseIpAllowlistInput(values: string[]): IpAllowlistParseResult {
  const entries: string[] = [];
  const errors: string[] = [];

  values.forEach((raw) => {
    const result = validateIpAllowlistEntry(raw);
    if (!result.valid) {
      errors.push(result.error ?? `"${raw}" is not a valid IP address or CIDR range.`);
      return;
    }
    if (!entries.some((entry) => entry.toLowerCase() === result.normalized.toLowerCase())) {
      entries.push(result.normalized);
    }
  });

  return { entries, errors };
}

/**
 * Appends a single entry to an allowlist, returning an error when the value is
 * invalid or already present.
 */
export function addIpAllowlistEntry(
  entries: string[],
  raw: string
): { entries: string[]; error: string | null } {
  if (!raw.trim()) return { entries, error: null };

  const result = validateIpAllowlistEntry(raw);
  if (!result.valid) {
    return { entries, error: result.error ?? `"${raw}" is not a valid IP address or CIDR range.` };
  }

  if (entries.some((entry) => entry.toLowerCase() === result.normalized.toLowerCase())) {
    return { entries, error: `"${result.normalized}" is already in the allowlist.` };
  }

  return { entries: [...entries, result.normalized], error: null };
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
    ipAllowlist: ['203.0.113.7', '2001:db8::/32'],
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
    ipAllowlist: ['203.0.113.0/24', '198.51.100.42'],
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
