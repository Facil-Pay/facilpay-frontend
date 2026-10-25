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
  /** Whether customers can pay with any asset via Stellar path payments */
  enablePathPayments?: boolean;
  /** Maximum acceptable slippage tolerance in percentage (e.g., 1.0 for 1%) */
  maxSlippagePercent?: number;
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

// ─── Two-factor authentication ────────────────────────────────────────────────

export interface TwoFactorStatus {
  enabled: boolean;
  enrolledAt?: string | null;
  /** Unused recovery codes left; prompt to regenerate when low */
  recoveryCodesRemaining: number;
}

/** POST /merchant/2fa/enroll — a pending TOTP secret, not active until confirmed */
export interface TwoFactorEnrollment {
  /** Base32 secret for manual entry */
  secret: string;
  /** otpauth:// URI rendered as the QR code */
  otpauthUrl: string;
}

/** POST /merchant/2fa/enroll/confirm */
export interface ConfirmTwoFactorRequest {
  code: string;
}

export interface ConfirmTwoFactorResponse {
  /** Shown once; the server only stores hashes */
  recoveryCodes: string[];
}

/** POST /merchant/2fa/disable */
export interface DisableTwoFactorRequest {
  password: string;
  /** Authenticator code or an unused recovery code */
  code: string;
}

/** Actions that require a fresh 2FA code even within an authenticated session. */
export type SensitiveAction = "create_payout" | "reveal_api_key" | "change_settlement_address";

/** POST /merchant/2fa/verify — exchanges a code for a short-lived step-up token */
export interface StepUpRequest {
  action: SensitiveAction;
  code: string;
}

export interface StepUpResponse {
  token: string;
  expiresAt: string;
}

// ─── Authentication ───────────────────────────────────────────────────────────

/** POST /auth/login */
export interface LoginRequest {
  email: string;
}

export type LoginResponse =
  | { status: "authenticated"; token: string }
  | { status: "two_factor_required"; challengeId: string };

/** POST /auth/login/2fa */
export interface LoginTwoFactorRequest {
  challengeId: string;
  code: string;
}

export interface LoginTwoFactorResponse {
  token: string;
}

export interface LinkedWallet {
  address: string;
  label?: string;
  /** e.g. "freighter", "xbull", "lobstr" */
  provider?: string;
  isSettlement: boolean;
  linkedAt: string;
}
