// ─── Payment Domain Types ─────────────────────────────────────────────────────

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";

export type PaymentNetwork = "stellar" | "ethereum" | "bitcoin" | "solana";

export type PaymentMethod =
  | "crypto"
  | "bank_transfer"
  | "card"
  | "wallet";

// ─── Timeline Event ───────────────────────────────────────────────────────────

export type TimelineEventType =
  | "created"
  | "processing"
  | "broadcast"
  | "confirmed"
  | "completed"
  | "failed"
  | "refund_initiated"
  | "refunded"
  | "cancelled";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  status: PaymentStatus;
  title: string;
  description: string;
  timestamp: string; // ISO 8601
  actor?: string;    // who triggered this event
  metadata?: Record<string, string | number | boolean>;
}

// ─── On-Chain Data ────────────────────────────────────────────────────────────

export interface OnChainData {
  network: PaymentNetwork;
  txHash: string;
  blockNumber?: number;
  blockHash?: string;
  confirmations: number;
  requiredConfirmations: number;
  ledgerSequence?: number;   // Stellar-specific
  fee: number;
  feeAsset: string;
  fromAddress: string;
  toAddress: string;
  memoText?: string;         // Stellar memo
  explorerUrl: string;
  broadcastAt?: string;      // ISO 8601
  confirmedAt?: string;      // ISO 8601
}

// ─── Participant ──────────────────────────────────────────────────────────────

export interface Participant {
  name: string;
  accountId: string;         // FacilPay internal ID
  walletAddress?: string;    // on-chain address
  email?: string;
  avatarUrl?: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  reference: string;         // human-readable ref, e.g. FP-2024-00123
  status: PaymentStatus;
  method: PaymentMethod;
  network?: PaymentNetwork;

  amount: number;
  currency: string;          // ISO 4217 or crypto ticker
  amountUsd?: number;        // USD equivalent at time of transaction

  sender: Participant;
  recipient: Participant;

  description?: string;
  notes?: string;
  tags?: string[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  expiresAt?: string;

  // On-chain
  onChain?: OnChainData;

  // Lifecycle
  events: TimelineEvent[];

  // Actions available on this payment
  canRefund: boolean;
  canCancel: boolean;
  canRetry: boolean;
}

// ─── List / Pagination ────────────────────────────────────────────────────────

export interface PaymentFilter {
  status?: PaymentStatus;
  method?: PaymentMethod;
  network?: PaymentNetwork;
  dateFrom?: string;   // ISO date string "YYYY-MM-DD"
  dateTo?: string;     // ISO date string "YYYY-MM-DD"
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
