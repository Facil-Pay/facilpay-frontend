"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  PendingRefundRequest,
  canApprove,
  markApproved,
  rejectRequest,
  refundApprovalThresholdStore,
  useRefundApprovalThreshold,
  usePendingRefundApprovals,
} from "@/lib/refund-approvals";
import { useCurrentMember } from "@/lib/team";
import { usePermission } from "@/components/auth/Can";
import { formatReason } from "./refund-format";
import { useToast } from "@/components/ui/toast";

export default function ApprovalsQueue() {
  const toast = useToast();
  const member = useCurrentMember();
  const canApproveRefunds = usePermission("refunds:approve");
  const allRequests = usePendingRefundApprovals();
  const threshold = useRefundApprovalThreshold();
  const pending = allRequests.filter((r: PendingRefundRequest) => r.status === "pending_approval");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleApprove = async (request: PendingRefundRequest) => {
    if (!member) return;
    setSubmittingId(request.id);
    try {
      // The actual on-chain refund submission goes through the same /payments/:id/refund
      // endpoint used for sub-threshold refunds, now that a second teammate has signed off.
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.post(`/payments/${request.paymentId}/refund`, {
        body: { amount: request.amount, reason: request.reason, reasonDetail: request.reasonDetail },
      });
      markApproved(request.id, member.id, member.name || member.email || "Unknown");
      toast(`Refund for ${request.paymentId} approved and submitted.`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not submit the approved refund.", "error");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = (request: PendingRefundRequest) => {
    if (!member || !rejectReason.trim()) return;
    rejectRequest(request.id, member.id, member.name || member.email || "Unknown", rejectReason.trim());
    setRejectingId(null);
    setRejectReason("");
    toast(`Refund for ${request.paymentId} rejected.`, "success");
  };

  if (pending.length === 0) return null;

  return (
    <section aria-label="Refund approvals" className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-violet-900 dark:text-violet-200">
          Pending Refund Approvals ({pending.length})
        </h3>
        {canApproveRefunds && (
          <label className="flex items-center gap-2 text-xs text-violet-800 dark:text-violet-300">
            Approval threshold
            <input
              type="number"
              min={0}
              step="any"
              value={threshold}
              onChange={(e) => refundApprovalThresholdStore.set(Math.max(0, Number(e.target.value)))}
              className="w-24 rounded-md border border-violet-200 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-violet-800 dark:bg-zinc-900 dark:text-white"
            />
          </label>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {pending.map((request) => {
          const selfApproval = !canApprove(request, member?.id);
          const disabled = !canApproveRefunds || selfApproval;
          return (
            <div key={request.id} className="rounded-lg border border-violet-200 bg-white p-3 text-xs dark:border-violet-900/50 dark:bg-zinc-900">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-mono font-semibold text-zinc-900 dark:text-white">{request.paymentId}</div>
                  <div className="text-zinc-600 dark:text-zinc-400">
                    Amount: <strong>{request.amount.toLocaleString()}</strong> · {formatReason(request.reason)}
                  </div>
                  {request.reasonDetail && <div className="text-zinc-500">{request.reasonDetail}</div>}
                  <div className="text-zinc-400">
                    Requested by {request.initiatedByName} on {new Date(request.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={disabled || submittingId === request.id}
                    title={selfApproval ? "You cannot approve a refund you requested yourself." : undefined}
                    onClick={() => void handleApprove(request)}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {submittingId === request.id && <Loader2 className="h-3 w-3 animate-spin" />}
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    title={selfApproval ? "You cannot reject a refund you requested yourself." : undefined}
                    onClick={() => setRejectingId(request.id)}
                    className="rounded-md border border-red-200 px-2.5 py-1 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {selfApproval && (
                <p className="mt-2 text-[11px] text-amber-600">
                  You requested this refund, so a different teammate with approval permission must review it.
                </p>
              )}

              {rejectingId === request.id && (
                <div className="mt-2 space-y-2 border-t border-violet-100 pt-2 dark:border-violet-900/40">
                  <textarea
                    required
                    placeholder="Reason for rejecting (required)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setRejectingId(null); setRejectReason(""); }}
                      className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium dark:border-zinc-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!rejectReason.trim()}
                      onClick={() => handleReject(request)}
                      className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
