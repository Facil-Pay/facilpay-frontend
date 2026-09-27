/**
 * lib/types/payout.ts
 *
 * Payout domain types.
 * A Payout represents a settlement transfer from the merchant's FacilPay
 * balance to their configured withdrawal destination.
 */

export type PayoutStatus =
  | "scheduled"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type PayoutFrequency = "manual" | "daily" | "weekly" | "monthly";

export interface PayoutDestination {
  type: "stellar" | "bank";
  /** Stellar public key or bank account reference */
  address: string;
  label?: string;
}

export interface Payout {
  id: string;
  merchantId: string;
  reference: string;
  status: PayoutStatus;

  amount: number;
  currency: string;
  amountUsd?: number;
  fee?: number;
  netAmount?: number;

  destination: PayoutDestination;

  /** On-chain settlement transaction hash */
  txHash?: string;
  explorerUrl?: string;

  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;

  note?: string;
}

export interface CreatePayoutRequest {
  amount: number;
  currency: string;
  destinationAddress: string;
  destinationType: "stellar" | "bank";
  note?: string;
}
