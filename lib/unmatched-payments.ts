/**
 * lib/unmatched-payments.ts
 *
 * Store and utilities for the Unmatched Payments / Reconciliation Inbox.
 *
 * "Unmatched" means an incoming Stellar payment whose memo does not map to
 * a known payment link, invoice, or customer. Resolution paths:
 *   1. Manual Match – link to an existing payment link / invoice / customer.
 *   2. Refund to Sender – initiate a return transfer.
 */

import { createLocalStore } from "./local-store";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UnmatchedStatus = "pending" | "matched" | "refunded";

export interface UnmatchedPayment {
  id: string;
  /** Originating Stellar address (G… or M…) */
  senderAddress: string;
  amount: number;
  asset: string;
  /** Raw Stellar transaction hash */
  txHash: string;
  /** Raw memo from the Stellar transaction, if any */
  rawMemo?: string;
  /** ISO 8601 timestamp of the on-chain transaction */
  timestamp: string;
  status: UnmatchedStatus;
  /** Set after a manual match */
  matchedTo?: {
    type: "payment_link" | "invoice" | "customer";
    id: string;
    label: string;
  };
  /** Set after a refund is initiated */
  refundTxHash?: string;
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export type AuditActionType =
  | "Authentication"
  | "API keys"
  | "Webhooks"
  | "Team"
  | "Payouts"
  | "Settings"
  | "Risk"
  | "Reconciliation";

export interface AuditEvent {
  id: string;
  actor: string;
  actionType: AuditActionType;
  action: string;
  target: string;
  ip: string;
  timestamp: string;
}

// ─── Sample data (declared before stores so initialiser can reference it) ─────

const SAMPLE_UNMATCHED: UnmatchedPayment[] = [
  {
    id: "unmatched_001",
    senderAddress: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF",
    amount: 150.0,
    asset: "USDC",
    txHash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    rawMemo: "ORDER-9999",
    timestamp: "2026-11-20T14:32:00.000Z",
    status: "pending",
  },
  {
    id: "unmatched_002",
    senderAddress: "GAYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A",
    amount: 75.5,
    asset: "USDC",
    txHash: "b2c3d4e5f6a7b2c3d4e5f6a7b2c3d4e5f6a7b2c3d4e5f6a7b2c3d4e5f6a7b2c3",
    rawMemo: undefined,
    timestamp: "2026-11-21T09:15:00.000Z",
    status: "pending",
  },
  {
    id: "unmatched_003",
    senderAddress: "GBT5PBINLNRI5RJPJBOPSMODBGIHALJQJ2ISTANRF54BGM2WVIBECCNB",
    amount: 2000.0,
    asset: "XLM",
    txHash: "c3d4e5f6a7b8c3d4e5f6a7b8c3d4e5f6a7b8c3d4e5f6a7b8c3d4e5f6a7b8c3d4",
    rawMemo: "hi there",
    timestamp: "2026-11-22T16:00:00.000Z",
    status: "pending",
  },
];

// ─── Stores ───────────────────────────────────────────────────────────────────

export const unmatchedStore = createLocalStore<UnmatchedPayment[]>(
  "facilpay_unmatched_payments",
  SAMPLE_UNMATCHED,
);

export const auditLogStore = createLocalStore<AuditEvent[]>(
  "facilpay_audit_log",
  [],
);

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useUnmatchedPayments = unmatchedStore.useStore;
export const useAuditLog = auditLogStore.useStore;

// ─── Selectors ────────────────────────────────────────────────────────────────

export function pendingCount(items: UnmatchedPayment[]): number {
  return items.filter((p) => p.status === "pending").length;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function appendAudit(event: Omit<AuditEvent, "id" | "timestamp">): void {
  auditLogStore.set((log) => [
    {
      ...event,
      id: `evt_${uid()}`,
      timestamp: new Date().toISOString(),
    },
    ...log,
  ]);
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Manually match an unmatched payment to a known entity.
 * Removes the item from the pending inbox and records an audit event.
 */
export function manualMatch(
  id: string,
  match: UnmatchedPayment["matchedTo"],
  actor = "Merchant",
): void {
  unmatchedStore.set((items) =>
    items.map((item) =>
      item.id === id
        ? { ...item, status: "matched" as UnmatchedStatus, matchedTo: match }
        : item,
    ),
  );

  appendAudit({
    actor,
    actionType: "Reconciliation",
    action: "Unmatched payment manually matched",
    target: `Payment ${id} → ${match?.type ?? ""} ${match?.id ?? ""}`,
    ip: "—",
  });
}

/**
 * Initiate a refund back to the sender for an unmatched payment.
 * Marks the item as refunded and records an audit event.
 */
export function refundToSender(
  id: string,
  refundTxHash: string,
  actor = "Merchant",
): void {
  unmatchedStore.set((items) =>
    items.map((item) =>
      item.id === id
        ? { ...item, status: "refunded" as UnmatchedStatus, refundTxHash }
        : item,
    ),
  );

  appendAudit({
    actor,
    actionType: "Reconciliation",
    action: "Unmatched payment refunded to sender",
    target: `Payment ${id} · tx ${refundTxHash}`,
    ip: "—",
  });
}
