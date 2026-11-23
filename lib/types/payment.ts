/**
 * lib/types/payment.ts
 *
 * Payment domain types aligned with the FacilPay REST API.
 * This is the single source for payment types: import them from
 * "@/lib/types", never redeclare them locally.
 */

import type { AssetType } from "./asset";

// ─── Enumerations ─────────────────────────────────────────────────────────────

/** Lowercase status values exactly as returned by the API. */
export const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded",
  "partially_refunded",
  "cancelled",
  "expired",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === "string" && (PAYMENT_STATUSES as readonly string[]).includes(value);
}

export type PaymentNetwork = "stellar" | "ethereum" | "bitcoin" | "solana";

export type PaymentMethod = "crypto" | "bank_transfer" | "card" | "wallet";

export type TimelineEventType =
  | "created"
  | "processing"
  | "broadcast"
  | "confirmed"
  | "completed"
  | "failed"
  | "refund_initiated"
  | "refunded"
  | "partially_refunded"
  | "cancelled"
  | "expired";

// ─── Sub-objects ──────────────────────────────────────────────────────────────

export interface Participant {
  id?: string;
  name: string;
  accountId: string;
  walletAddress?: string;
  email?: string;
  avatarUrl?: string;
}

export interface OnChainData {
  network: PaymentNetwork;
  txHash: string;
  blockNumber?: number;
  blockHash?: string;
  confirmations: number;
  requiredConfirmations: number;
  ledgerSequence?: number;
  fee: number;
  feeAsset: string;
  fromAddress: string;
  toAddress: string;
  memoText?: string;
  explorerUrl: string;
  broadcastAt?: string;
  confirmedAt?: string;
}

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  status: PaymentStatus;
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
  metadata?: Record<string, string | number | boolean>;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  reference: string;
  status: PaymentStatus;
  method: PaymentMethod;
  network?: PaymentNetwork;

  amount: number;
  currency: string;
  amountUsd?: number;

  sender: Participant;
  recipient: Participant;

  description?: string;
  notes?: string;
  tags?: string[];

  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  expiresAt?: string;

  onChain?: OnChainData;
  events: TimelineEvent[];

  canRefund: boolean;
  canCancel: boolean;
  canRetry: boolean;
}

// ─── Request / Response shapes ────────────────────────────────────────────────

export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  network: PaymentNetwork;
  method: PaymentMethod;
  senderId: string;
  recipientId: string;
  description?: string;
  notes?: string;
  tags?: string[];
  expiresAt?: string;
}

export interface UpdatePaymentRequest {
  description?: string;
  notes?: string;
  tags?: string[];
}

export interface PaymentFilter {
  status?: PaymentStatus;
  method?: PaymentMethod;
  network?: PaymentNetwork;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export type PaymentSortField = "createdAt" | "amount" | "status" | "reference";
export type PaymentSortOrder = "asc" | "desc";

export interface PaginatedPayments {
  data: Payment[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaymentListParams extends PaymentFilter {
  page?: number;
  pageSize?: number;
  sortField?: PaymentSortField;
  sortOrder?: PaymentSortOrder;
}

// ─── Ledger record ────────────────────────────────────────────────────────────

/**
 * Flattened, settled view of a payment used by CSV export, PDF receipts,
 * reconciliation and the mock-backed payments table. It shares
 * `PaymentStatus` with the API `Payment` so badges and filters agree.
 */
export interface PaymentRecord {
  id: string;
  /** ISO 8601, e.g. 2026-01-15T14:32:00.000Z */
  date: string;
  amount: number;
  asset: AssetType;
  status: PaymentStatus;
  customerEmail: string;
  customerWallet: string;
  merchantId: string;
  merchantName: string;
  merchantEmail: string;
  txHash: string;
  stellarExpertUrl: string;
  fee: number;
  description: string;
  memo: string;
  sourceAsset?: string;
  sourceAmount?: number;
  path?: string[];
  /** FacilPay platform fee in the payment asset */
  facilpayFee?: number;
  /** Amount the merchant actually received (amount − facilpayFee) */
  netAmount?: number;
  /** Exchange rate applied when the asset was converted (e.g. XLM→USDC) */
  conversionRate?: number;
  /** Stellar network fee in XLM */
  networkFeeXlm?: number;
}
