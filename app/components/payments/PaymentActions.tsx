"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import type { Payment } from "@/app/lib/types/payment";

// ─── Icons ────────────────────────────────────────────────────────────────────

function RefundIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M7.793 2.232a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.497v1.517c0 5.206-3.603 9.548-8.5 10.986C4.388 16.548.785 12.206.785 7V5.483a.5.5 0 01.48-.497 11.947 11.947 0 007.078-2.749h.318z" clipRule="evenodd" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
    </svg>
  );
}

function CancelIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.367A2.52 2.52 0 0113 4.5z" />
    </svg>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

type ActionType = "refund" | "retry" | "cancel" | null;

interface ConfirmModalProps {
  action: ActionType;
  payment: Payment;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

const actionConfig: Record<
  NonNullable<ActionType>,
  { title: string; body: string; confirmLabel: string; variant: "danger" | "primary" | "secondary" }
> = {
  refund: {
    title: "Refund Payment",
    body: "This will initiate a full refund to the sender. The funds will be returned on-chain. This action cannot be undone.",
    confirmLabel: "Issue Refund",
    variant: "danger",
  },
  retry: {
    title: "Retry Payment",
    body: "This will rebroadcast the transaction to the network with the original parameters. Ensure the sender wallet has sufficient balance before retrying.",
    confirmLabel: "Retry Payment",
    variant: "primary",
  },
  cancel: {
    title: "Cancel Payment",
    body: "Cancelling will prevent this payment from being processed. It cannot be uncancelled.",
    confirmLabel: "Cancel Payment",
    variant: "danger",
  },
};

function ConfirmModal({ action, payment, onConfirm, onClose, loading }: ConfirmModalProps) {
  if (!action) return null;
  const cfg = actionConfig[action];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-100">
          <h3 id="modal-title" className="text-base font-semibold text-zinc-900">
            {cfg.title}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">{payment.reference}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-sm text-zinc-600 leading-relaxed">{cfg.body}</p>
          <div className="mt-4 rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Amount</span>
            <span className="text-sm font-bold text-zinc-900 tabular-nums">
              {payment.amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              {payment.currency}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={cfg.variant} size="md" loading={loading} onClick={onConfirm}>
            {cfg.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Export helper ────────────────────────────────────────────────────────────

function exportPaymentAsJson(payment: Payment) {
  const blob = new Blob([JSON.stringify(payment, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${payment.reference}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Toast notification ───────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  type: "success" | "error";
}

function Toast({ message, type }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border text-sm font-medium animate-in ${
        type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}
    >
      {type === "success" ? (
        <svg className="h-4 w-4 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="h-4 w-4 text-red-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      )}
      {message}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PaymentActionsProps {
  payment: Payment;
}

export function PaymentActions({ payment }: PaymentActionsProps) {
  const [pendingAction, setPendingAction] = useState<ActionType>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastProps | null>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleConfirm() {
    if (!pendingAction) return;
    setLoading(true);

    // Simulate async API call
    await new Promise((r) => setTimeout(r, 1400));

    setLoading(false);
    setPendingAction(null);

    const messages: Record<NonNullable<ActionType>, string> = {
      refund: "Refund initiated successfully.",
      retry:  "Payment rebroadcast to the network.",
      cancel: "Payment cancelled.",
    };
    showToast(messages[pendingAction], "success");
  }

  function handleCopyLink() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => showToast("Payment link copied to clipboard.", "success"))
      .catch(() => showToast("Could not copy link.", "error"));
  }

  const hasActions = payment.canRefund || payment.canRetry || payment.canCancel;

  return (
    <>
      <Card>
        <h2 className="text-base font-semibold text-zinc-900 mb-4">Actions</h2>

        <div className="flex flex-col gap-2">
          {/* Primary actions */}
          {payment.canRefund && (
            <Button
              variant="outline"
              size="md"
              icon={<RefundIcon />}
              className="w-full justify-start"
              onClick={() => setPendingAction("refund")}
            >
              Issue Refund
            </Button>
          )}

          {payment.canRetry && (
            <Button
              variant="primary"
              size="md"
              icon={<RetryIcon />}
              className="w-full justify-start"
              onClick={() => setPendingAction("retry")}
            >
              Retry Payment
            </Button>
          )}

          {payment.canCancel && (
            <Button
              variant="danger"
              size="md"
              icon={<CancelIcon />}
              className="w-full justify-start"
              onClick={() => setPendingAction("cancel")}
            >
              Cancel Payment
            </Button>
          )}

          {!hasActions && (
            <p className="text-xs text-zinc-500 py-2 text-center">
              No actions available for this payment.
            </p>
          )}

          {/* Divider */}
          <hr className="border-zinc-100 my-1" />

          {/* Utility actions — always available */}
          <Button
            variant="ghost"
            size="md"
            icon={<ExportIcon />}
            className="w-full justify-start"
            onClick={() => exportPaymentAsJson(payment)}
          >
            Export as JSON
          </Button>

          <Button
            variant="ghost"
            size="md"
            icon={<ShareIcon />}
            className="w-full justify-start"
            onClick={handleCopyLink}
          >
            Copy Payment Link
          </Button>
        </div>
      </Card>

      {/* Confirm modal */}
      {pendingAction && (
        <ConfirmModal
          action={pendingAction}
          payment={payment}
          onConfirm={handleConfirm}
          onClose={() => !loading && setPendingAction(null)}
          loading={loading}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}
