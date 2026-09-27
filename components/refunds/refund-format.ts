import type { Refund, RefundEvent, RefundReason, RefundStatus } from "@/lib/types/refund";

export const REFUND_STATUSES: RefundStatus[] = ["pending", "processing", "completed", "failed"];
export const REFUND_ASSETS = ["XLM", "USDC", "EURC"];

export const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const REFUND_STATUS_CLASS: Record<RefundStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  processing: "bg-sky-50 text-sky-700 ring-sky-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
  cancelled: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

const REASON_LABEL: Record<RefundReason, string> = {
  customer_request: "Customer request",
  duplicate_payment: "Duplicate payment",
  fraudulent: "Fraudulent",
  product_not_received: "Product not received",
  product_unacceptable: "Product unacceptable",
  subscription_cancelled: "Subscription cancelled",
  other: "Other",
};

export function formatReason(reason: RefundReason): string {
  return REASON_LABEL[reason] ?? reason;
}

export function formatAmount(amount: number, asset: string): string {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })} ${asset}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function explorerTxUrl(refund: Refund): string | undefined {
  if (refund.explorerUrl) return refund.explorerUrl;
  if (!refund.txHash) return undefined;
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${network}/tx/${refund.txHash}`;
}

/** Status history for the detail timeline; derived from timestamps when the API omits events. */
export function refundTimeline(refund: Refund): RefundEvent[] {
  if (refund.events?.length) return refund.events;
  const events: RefundEvent[] = [{ status: "pending", at: refund.createdAt, note: "Refund requested" }];
  if (refund.status === "completed" && refund.completedAt) {
    events.push({ status: "completed", at: refund.completedAt, note: "Settled on-chain" });
  } else if (refund.status !== "pending") {
    events.push({ status: refund.status, at: refund.updatedAt, note: refund.failureReason });
  }
  return events;
}
