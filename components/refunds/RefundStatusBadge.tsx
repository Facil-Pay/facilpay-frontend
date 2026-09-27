import { cn } from "@/components/ui/utils";
import type { RefundStatus } from "@/lib/types/refund";
import { REFUND_STATUS_CLASS, REFUND_STATUS_LABEL } from "./refund-format";

export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        REFUND_STATUS_CLASS[status],
      )}
    >
      {REFUND_STATUS_LABEL[status]}
    </span>
  );
}
