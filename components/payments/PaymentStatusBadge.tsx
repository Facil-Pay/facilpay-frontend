import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { PaymentStatus } from "@/app/lib/types/payment";

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

const statusConfig: Record<DisplayPaymentStatus, { label: string; variant: BadgeVariant }> = {
  pending:    { label: "Pending",    variant: "warning"  },
  processing: { label: "Processing", variant: "info"     },
  completed:  { label: "Completed",  variant: "success"  },
  failed:     { label: "Failed",     variant: "danger"   },
  refunded:   { label: "Refunded",   variant: "neutral"  },
  cancelled:  { label: "Cancelled",  variant: "neutral"  },
  flagged:    { label: "Flagged",    variant: "warning"  },
};

export function PaymentStatusBadge({
  status,
  size = "sm",
  dot = true,
  className,
  flagReason,
}: PaymentStatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, variant: "neutral" as BadgeVariant };

  if (status === "flagged") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ${className ?? ""}`}
        title={flagReason}
        aria-label={flagReason ? `Flagged: ${flagReason}` : "Flagged"}
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
        {flagReason ? `Flagged — ${flagReason}` : "Flagged"}
      </span>
    );
  }

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
