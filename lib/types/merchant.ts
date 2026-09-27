/**
 * lib/types/merchant.ts
 *
 * Merchant and TeamMember domain types.
 */

export type MerchantStatus = "active" | "suspended" | "pending_kyc" | "closed";

export type MerchantTier = "starter" | "growth" | "enterprise";

export interface MerchantAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;    // ISO 3166-1 alpha-2
}

export interface Merchant {
  id: string;
  name: string;
  slug: string;
  status: MerchantStatus;
  tier: MerchantTier;

  email: string;
  phone?: string;
  website?: string;
  logoUrl?: string;

  address?: MerchantAddress;

  /** Stellar account used as the settlement wallet */
  stellarAccountId?: string;

  /** Default currency for new payments */
  defaultCurrency: string;

  /** Networks enabled for this merchant */
  enabledNetworks: string[];

  kycVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Team member ──────────────────────────────────────────────────────────────

export type TeamRole = "owner" | "admin" | "developer" | "analyst" | "viewer";

export type TeamMemberStatus = "active" | "invited" | "deactivated";

export interface TeamMember {
  id: string;
  merchantId: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: TeamRole;
  status: TeamMemberStatus;
  invitedAt?: string;
  joinedAt?: string;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InviteTeamMemberRequest {
  email: string;
  name: string;
  role: TeamRole;
}

export interface UpdateTeamMemberRequest {
  role?: TeamRole;
  status?: "active" | "deactivated";
}
