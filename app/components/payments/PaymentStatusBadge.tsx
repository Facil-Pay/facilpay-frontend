import { Badge, type BadgeVariant } from "@/app/components/ui/Badge";
import type { PaymentStatus } from "@/app/lib/types/payment";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const statusConfig: Record<
  PaymentStatus,
  { label: string; variant: BadgeVariant }
> = {
  pending:    { label: "Pending",    variant: "warning" },
  processing: { label: "Processing", variant: "info"    },
  completed:  { label: "Completed",  variant: "success" },
  failed:     { label: "Failed",     variant: "danger"  },
  refunded:   { label: "Refunded",   variant: "neutral" },
  cancelled:  { label: "Cancelled",  variant: "neutral" },
};

export function PaymentStatusBadge({
  status,
  size = "sm",
  dot = true,
  className,
}: PaymentStatusBadgeProps) {
  const { label, variant } = statusConfig[status] ?? {
    label: status,
    variant: "neutral" as BadgeVariant,
  };

  return (
    <Badge variant={variant} size={size} dot={dot} className={className}>
      {label}
    </Badge>
  );
}

/** Larger pill used as the headline status on the detail page */
export function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  return <PaymentStatusBadge status={status} size="md" dot />;
}
