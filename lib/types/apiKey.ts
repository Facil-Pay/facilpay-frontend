/**
 * lib/types/apiKey.ts
 *
 * API key domain types.
 */

export type ApiKeyPermission =
  | "payments:read"
  | "payments:write"
  | "refunds:read"
  | "refunds:write"
  | "escrow:read"
  | "escrow:write"
  | "webhooks:read"
  | "webhooks:write"
  | "payouts:read"
  | "payouts:write"
  | "team:read"
  | "team:write";

export type ApiKeyStatus = "active" | "revoked" | "expired";

export interface ApiKey {
  id: string;
  merchantId: string;
  name: string;
  /** Key prefix shown in the UI — the full key is shown only at creation */
  prefix: string;
  /** Full key value — only present in the creation response */
  key?: string;
  status: ApiKeyStatus;
  permissions: ApiKeyPermission[];
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: ApiKeyPermission[];
  expiresAt?: string;
}
