"use client";

import { createLocalStore } from "./local-store";
import type { RefundReason } from "./types/refund";

export type ApprovalDecisionStatus = "pending_approval" | "approved" | "rejected";

export interface PendingRefundRequest {
  id: string;
  paymentId: string;
  amount: number;
  reason: RefundReason;
  reasonDetail?: string;
  initiatedBy: string;
  initiatedByName: string;
  createdAt: string;
  status: ApprovalDecisionStatus;
  decidedBy?: string;
  decidedByName?: string;
  decidedAt?: string;
  rejectionReason?: string;
}

/** Refunds at or above this amount must be approved by a second teammate before submission. */
export const refundApprovalThresholdStore = createLocalStore<number>("facilpay_refund_approval_threshold", 500);
export const useRefundApprovalThreshold = refundApprovalThresholdStore.useStore;

export const pendingRefundApprovalsStore = createLocalStore<PendingRefundRequest[]>(
  "facilpay_pending_refund_approvals",
  [],
);
export const usePendingRefundApprovals = pendingRefundApprovalsStore.useStore;

export function requiresApproval(amount: number): boolean {
  return amount >= refundApprovalThresholdStore.get();
}

export function queueForApproval(input: {
  paymentId: string;
  amount: number;
  reason: RefundReason;
  reasonDetail?: string;
  initiatedBy: string;
  initiatedByName: string;
}): PendingRefundRequest {
  const request: PendingRefundRequest = {
    id: `reqappr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    ...input,
    createdAt: new Date().toISOString(),
    status: "pending_approval",
  };
  pendingRefundApprovalsStore.set((prev) => [request, ...prev]);
  return request;
}

/** A requester may never approve their own refund request. */
export function canApprove(request: PendingRefundRequest, currentMemberId: string | undefined): boolean {
  return !!currentMemberId && currentMemberId !== request.initiatedBy;
}

export function markApproved(id: string, approverId: string, approverName: string) {
  pendingRefundApprovalsStore.set((prev) =>
    prev.map((r) =>
      r.id === id
        ? { ...r, status: "approved", decidedBy: approverId, decidedByName: approverName, decidedAt: new Date().toISOString() }
        : r,
    ),
  );
}

export function rejectRequest(id: string, approverId: string, approverName: string, reason: string) {
  pendingRefundApprovalsStore.set((prev) =>
    prev.map((r) =>
      r.id === id
        ? {
            ...r,
            status: "rejected",
            decidedBy: approverId,
            decidedByName: approverName,
            decidedAt: new Date().toISOString(),
            rejectionReason: reason,
          }
        : r,
    ),
  );
}
