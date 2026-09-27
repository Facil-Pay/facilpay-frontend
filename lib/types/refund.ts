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
}

export interface CreateRefundRequest {
  paymentId: string;
  amount?: number;       // defaults to full payment amount
  reason: RefundReason;
  reasonDetail?: string;
}
