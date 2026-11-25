import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { PAYMENT_STATUS_META, paymentStatusLabel } from "./payment-status";
import type { PaymentStatus } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Extends the base PaymentStatus with "flagged" so badges can display
 * risk-rule violations without altering the core status model.
 */
export type DisplayPaymentStatus = PaymentStatus | "flagged";

interface PaymentStatusBadgeProps {
  status: DisplayPaymentStatus;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
  /** When status is "flagged", provide the specific trigger reason. */
  flagReason?: string;
}

export function PaymentStatusBadge({
  status,
  size = "sm",
  dot = true,
  className,
  flagReason,
}: PaymentStatusBadgeProps) {
  const meta = PAYMENT_STATUS_META[status];
  const label = meta?.label ?? paymentStatusLabel(status);
  const variant: BadgeVariant = meta?.variant ?? "neutral";

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={dot}
      className={className}
    >
      {config.label}
    </Badge>
  );
}

/** Larger pill used as the headline status on the detail page. */
export function PaymentStatusPill({
  status,
  flagReason,
}: {
  status: DisplayPaymentStatus;
  flagReason?: string;
}) {
  return <PaymentStatusBadge status={status} size="md" dot flagReason={flagReason} />;
}
