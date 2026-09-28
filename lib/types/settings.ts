/**
 * lib/types/settings.ts
 *
 * Merchant settings: business profile, checkout branding, payment
 * preferences and account security.
 */

export type SettlementAsset = "XLM" | "USDC" | "EURC";

export interface BusinessProfile {
  businessName: string;
  legalName: string;
  website: string;
  supportEmail: string;
  /** ISO 3166-1 alpha-2 */
  country: string;
  category: string;
  /** Stellar account (G…) that receives settlements */
  settlementAddress: string;
}

export interface Branding {
  logoUrl?: string | null;
  /** Hex colour, e.g. #20A7EE */
  brandColor: string;
}

/** POST /merchant/branding/logo — logo sent as a base64 data URL */
export interface UploadLogoRequest {
  fileName: string;
  contentType: "image/png" | "image/svg+xml";
  dataUrl: string;
}

export interface UploadLogoResponse {
  logoUrl: string;
}

export interface PaymentPreferences {
  acceptedAssets: SettlementAsset[];
  /** Default payment link lifetime in hours; 0 = never expires */
  defaultLinkExpiryHours: number;
  defaultRedirectUrl: string;
  /** Prepended to the Stellar memo / statement descriptor */
  memoPrefix: string;
}

export interface MerchantSession {
  id: string;
  device: string;
  browser?: string;
  ipAddress: string;
  location?: string;
  lastActiveAt: string;
  createdAt: string;
  /** True for the session making the request */
  current: boolean;
}

export interface LinkedWallet {
  address: string;
  label?: string;
  /** e.g. "freighter", "xbull", "lobstr" */
  provider?: string;
  isSettlement: boolean;
  linkedAt: string;
}
