import type { BadgeVariant } from "@/components/ui/badge";
import type { PaymentStatus } from "@/lib/types";

export interface PaymentStatusMeta {
  label: string;
  variant: BadgeVariant;
  /** Hex colour for charts (donut segments, legends) */
  chartColor: string;
}

/**
 * Single mapping from API payment status to label, badge variant and chart
 * colour. Every page renders payment statuses through this table so the
 * same status always looks the same.
 */
export const PAYMENT_STATUS_META: Record<PaymentStatus, PaymentStatusMeta> = {
  pending:            { label: "Pending",            variant: "warning", chartColor: "#f59e0b" },
  processing:         { label: "Processing",         variant: "info",    chartColor: "#0ea5e9" },
  completed:          { label: "Completed",          variant: "success", chartColor: "#10b981" },
  failed:             { label: "Failed",             variant: "danger",  chartColor: "#ef4444" },
  refunded:           { label: "Refunded",           variant: "neutral", chartColor: "#8b5cf6" },
  partially_refunded: { label: "Partially refunded", variant: "neutral", chartColor: "#a78bfa" },
  cancelled:          { label: "Cancelled",          variant: "neutral", chartColor: "#71717a" },
  expired:            { label: "Expired",            variant: "neutral", chartColor: "#a1a1aa" },
};

/** Label for any status string, falling back to a humanised value. */
export function paymentStatusLabel(status: string): string {
  return (
    PAYMENT_STATUS_META[status as PaymentStatus]?.label ??
    status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
  );
}
