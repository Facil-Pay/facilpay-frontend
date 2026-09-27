/**
 * lib/types/analytics.ts
 *
 * Types for the deeper analytics widgets (asset breakdown, funnel,
 * top customers, payment method split, geography).
 */

export type AnalyticsRange = "7d" | "30d" | "90d" | "1y";

export interface AnalyticsInsightsParams {
  range: AnalyticsRange;
  /** Restrict to a single asset; omit for all assets */
  asset?: string;
}

export interface AssetVolume {
  asset: string;
  /** Volume in USD */
  volume: number;
  txCount: number;
}

export type FunnelStepKey = "link_opened" | "wallet_connected" | "transaction_signed" | "payment_confirmed";

export interface FunnelStep {
  key: FunnelStepKey;
  count: number;
}

export interface TopCustomer {
  /** Stellar address, or email when the customer provided one */
  identifier: string;
  email?: string;
  paymentCount: number;
  /** Total volume in USD */
  total: number;
  lastPaymentAt: string;
}

export type PaymentMethod = "wallet_connect" | "qr_scan" | "manual_transfer";

export interface PaymentMethodShare {
  method: PaymentMethod;
  count: number;
  volume: number;
}

export interface CountryVolume {
  /** ISO 3166-1 alpha-2 */
  country: string;
  volume: number;
  txCount: number;
}

export interface AnalyticsInsights {
  assets: AssetVolume[];
  funnel: FunnelStep[];
  topCustomers: TopCustomer[];
  paymentMethods: PaymentMethodShare[];
  /** Only present when the backend has geo data */
  geography?: CountryVolume[];
}
