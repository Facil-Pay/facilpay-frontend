"use client";

import React, { useState } from "react";
import type { RefundReason } from "@/lib/types/refund";
import { REFUND_REASONS, formatReason } from "./refund-format";
import { useRefundPayment } from "@/lib/api/hooks/usePayments";
import { requiresApproval, queueForApproval, useRefundApprovalThreshold } from "@/lib/refund-approvals";
import { useCurrentMember } from "@/lib/team";

interface NewRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (message: string) => void;
}

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white";

export default function NewRefundModal({ isOpen, onClose, onSubmitted }: NewRefundModalProps) {
  const member = useCurrentMember();
  const approvalThreshold = useRefundApprovalThreshold();
  const [paymentId, setPaymentId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<RefundReason>("customer_request");
  const [reasonDetail, setReasonDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refund = useRefundPayment(paymentId.trim());

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const willNeedApproval = numAmount > 0 && requiresApproval(numAmount);

  const reset = () => {
    setPaymentId("");
    setAmount("");
    setReason("customer_request");
    setReasonDetail("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPaymentId = paymentId.trim();
    if (!cleanPaymentId) {
      setError("Enter the payment ID this refund applies to.");
      return;
    }
    if (numAmount <= 0) {
      setError("Enter a refund amount greater than 0.");
      return;
    }
    if (!member) {
      setError("Could not identify the current team member.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (requiresApproval(numAmount)) {
        queueForApproval({
          paymentId: cleanPaymentId,
          amount: numAmount,
          reason,
          reasonDetail: reasonDetail.trim() || undefined,
          initiatedBy: member.id,
          initiatedByName: member.name || member.email || "Unknown",
        });
        onSubmitted(
          `This refund is above the ${approvalThreshold.toLocaleString()} approval threshold and was sent to the approvals queue. A teammate must approve it before it's submitted.`,
        );
      } else {
        await refund.mutateAsync({ amount: numAmount, reason, reasonDetail: reasonDetail.trim() || undefined });
        onSubmitted("Refund submitted.");
      }
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the refund.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">New Refund</h2>
          <button
            onClick={() => { reset(); onClose(); }}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Payment ID *</label>
            <input
              type="text"
              required
              placeholder="pay_20260115_9f8a2c"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Amount *</label>
            <input
              type="number"
              required
              min="0.01"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Reason *</label>
            <select value={reason} onChange={(e) => setReason(e.target.value as RefundReason)} className={inputClass}>
              {REFUND_REASONS.map((r) => (
                <option key={r} value={r}>{formatReason(r)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Notes (Optional)</label>
            <textarea
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>

          {willNeedApproval && (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-800 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300">
              This amount is at or above the {approvalThreshold.toLocaleString()} approval threshold. It will be
              queued for a second teammate to approve instead of submitting immediately.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { reset(); onClose(); }}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#000F24] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60 dark:bg-[#55C2FF] dark:text-black"
            >
              {isSubmitting ? "Submitting..." : willNeedApproval ? "Submit for Approval" : "Create Refund"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
