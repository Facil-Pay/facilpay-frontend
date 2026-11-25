/**
 * lib/types/payout.ts
 *
 * Payout domain types.
 * A Payout represents a settlement transfer from the merchant's FacilPay
 * balance to their configured withdrawal destination.
 * Single source: import from "@/lib/types".
 */

import type { AssetType } from "./asset";

/** Lowercase status values exactly as returned by the API. */
export const PAYOUT_STATUSES = [
  "scheduled",
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;

export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

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

/** A saved withdrawal destination (Stellar account or federation address). */
export interface SavedDestination {
  id: string;
  label: string;
  /** Stellar G... or federation address name*domain.com */
  address: string;
  resolvedAddress?: string;
  memo?: string;
  memoType?: "text" | "id" | "hash";
  isExchange?: boolean;
  exchangeName?: string;
  createdAt: string;
}

/**
 * Flattened payout row used by the payouts table, CSV export,
 * reconciliation and the SEP-24 tracker. Shares `PayoutStatus` with `Payout`.
 */
export interface PayoutRecord {
  id: string;
  /** ISO 8601 */
  date: string;
  amount: number;
  asset: AssetType;
  status: PayoutStatus;
  destinationWallet: string;
  destinationLabel?: string;
  payoutMethod: string;
  txHash: string;
  fee: number;
  memo?: string;
  memoType?: string;
  sep24TransactionId?: string;
  anchorName?: string;
  bankDetailsSummary?: string;
}
