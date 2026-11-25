import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { PAYMENT_STATUS_META, paymentStatusLabel } from "./payment-status";
import type { PaymentStatus } from "@/lib/types";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export function PaymentStatusBadge({
  status,
  size = "sm",
  dot = true,
  className,
}: PaymentStatusBadgeProps) {
  const meta = PAYMENT_STATUS_META[status];
  const label = meta?.label ?? paymentStatusLabel(status);
  const variant: BadgeVariant = meta?.variant ?? "neutral";

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
