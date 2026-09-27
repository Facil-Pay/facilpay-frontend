"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, RotateCw, X } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { Refund } from "@/lib/types/refund";
import { RefundStatusBadge } from "./RefundStatusBadge";
import {
  REFUND_STATUS_LABEL,
  explorerTxUrl,
  formatAmount,
  formatDateTime,
  formatReason,
  refundTimeline,
} from "./refund-format";

interface RefundDetailDrawerProps {
  refund: Refund | null;
  onClose: () => void;
  onRetry: (refund: Refund) => void;
  isRetrying: boolean;
}

export function RefundDetailDrawer({ refund, onClose, onRetry, isRetrying }: RefundDetailDrawerProps) {
  const open = refund !== null;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const txUrl = refund ? explorerTxUrl(refund) : undefined;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="refund-drawer-title"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {refund && (
          <>
            <header className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5">
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">{refund.reference}</p>
                <h2 id="refund-drawer-title" className="truncate font-mono text-sm font-semibold text-zinc-900">
                  {refund.id}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close refund details"
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-zinc-500">Amount</p>
                  <p className="text-2xl font-semibold text-zinc-900">{formatAmount(refund.amount, refund.currency)}</p>
                  {refund.amountUsd != null && (
                    <p className="text-xs text-zinc-500">≈ ${refund.amountUsd.toFixed(2)} USD</p>
                  )}
                </div>
                <RefundStatusBadge status={refund.status} />
              </div>

              {refund.status === "failed" && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
                  <p className="font-medium text-red-800">This refund failed</p>
                  {refund.failureReason && <p className="mt-1 text-red-700">{refund.failureReason}</p>}
                  <button
                    type="button"
                    onClick={() => onRetry(refund)}
                    disabled={isRetrying}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {isRetrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
                    Retry refund
                  </button>
                </div>
              )}

              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <Detail label="Original payment">
                  <Link href={`/payments/${refund.paymentId}`} className="break-all font-mono text-xs text-sky-600 hover:underline">
                    {refund.paymentId}
                  </Link>
                </Detail>
                <Detail label="Reason">
                  {formatReason(refund.reason)}
                  {refund.reasonDetail && <span className="block text-xs text-zinc-500">{refund.reasonDetail}</span>}
                </Detail>
                <Detail label="Initiated by">{refund.initiatedBy}</Detail>
                <Detail label="Created">{formatDateTime(refund.createdAt)}</Detail>
                {refund.completedAt && <Detail label="Completed">{formatDateTime(refund.completedAt)}</Detail>}
                <Detail label="On-chain transaction" wide>
                  {txUrl ? (
                    <a
                      href={txUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1 font-mono text-xs text-sky-600 hover:underline"
                    >
                      <span className="truncate">{refund.txHash ?? "View on explorer"}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-zinc-400">Not yet submitted</span>
                  )}
                </Detail>
              </dl>

              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Timeline</h3>
                <ol className="relative space-y-4 border-l border-zinc-200 pl-5">
                  {refundTimeline(refund).map((event, index) => (
                    <li key={`${event.status}-${index}`} className="relative">
                      <span
                        className={cn(
                          "absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white",
                          event.status === "failed" ? "bg-red-500" : event.status === "completed" ? "bg-emerald-500" : "bg-sky-500",
                        )}
                      />
                      <p className="text-sm font-medium text-zinc-900">{REFUND_STATUS_LABEL[event.status]}</p>
                      <p className="text-xs text-zinc-500">{formatDateTime(event.at)}</p>
                      {event.note && <p className="mt-0.5 text-xs text-zinc-600">{event.note}</p>}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Detail({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-2")}>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-zinc-900">{children}</dd>
    </div>
  );
}
