/**
 * lib/types/refund.ts
 *
 * Refund domain types.
 */

export type RefundStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type RefundReason =
  | "customer_request"
  | "duplicate_payment"
  | "fraudulent"
  | "product_not_received"
  | "product_unacceptable"
  | "subscription_cancelled"
  | "other";

export interface Refund {
  id: string;
  paymentId: string;
  /** Human-readable reference, e.g. REF-2026-00012 */
  reference: string;
  status: RefundStatus;
  reason: RefundReason;
  reasonDetail?: string;

  amount: number;
  currency: string;
  amountUsd?: number;

  /** On-chain transaction hash of the refund tx */
  txHash?: string;
  explorerUrl?: string;

  initiatedBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;

  /** Populated when status is "failed" */
  failureReason?: string;
  /** Status history, oldest first. Falls back to timestamps when absent. */
  events?: RefundEvent[];
}

export interface RefundEvent {
  status: RefundStatus;
  at: string;
  note?: string;
}

/** Filters accepted by GET /refunds */
export interface RefundListParams {
  page?: number;
  pageSize?: number;
  status?: RefundStatus;
  asset?: string;
  /** ISO date (YYYY-MM-DD), inclusive */
  from?: string;
  /** ISO date (YYYY-MM-DD), inclusive */
  to?: string;
  /** Matches refund ID, payment ID or transaction hash */
  q?: string;
}

/** GET /refunds/summary — aggregates for the selected period */
export interface RefundSummary {
  totalRefunded: number;
  currency: string;
  /** Refunded volume as a fraction of payment volume (0–1) */
  refundRate: number;
  pendingCount: number;
}

/**
 * POST /refunds/:id/retry — the backend rebuilds the refund transaction.
 * When `xdr` is present it must be signed by the merchant wallet and
 * submitted via POST /refunds/:id/submit.
 */
export interface RetryRefundResponse {
  refund: Refund;
  xdr?: string;
}

export interface CreateRefundRequest {
  paymentId: string;
  amount?: number;       // defaults to full payment amount
  reason: RefundReason;
  reasonDetail?: string;
}
