/**
 * lib/types/payment.ts
 *
 * Payment domain types aligned with the FacilPay REST API.
 * These mirror and extend the existing app/lib/types/payment.ts but live in
 * the framework-agnostic lib/ layer so they can be used outside Next.js too.
 */

// ─── Enumerations ─────────────────────────────────────────────────────────────

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled"
  | "expired";

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
  | "cancelled"
  | "expired";

// ─── Sub-objects ──────────────────────────────────────────────────────────────

export interface Participant {
  id: string;
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

export interface PaymentListParams extends PaymentFilter {
  page?: number;
  pageSize?: number;
  sortField?: PaymentSortField;
  sortOrder?: PaymentSortOrder;
}
