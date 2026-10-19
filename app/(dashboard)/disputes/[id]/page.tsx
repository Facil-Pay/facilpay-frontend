"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  RotateCcw,
  Send,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  FileText,
  User,
  Shield,
  ExternalLink,
  X,
  FileCheck,
} from "lucide-react";
import {
  useDisputes,
  disputeActions,
  type DisputeCase,
  type DisputeMessage,
  type DisputeStatus,
} from "@/lib/disputes";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DisputeDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { cases } = useDisputes();

  const [replyText, setReplyText] = useState("");
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pre-filled refund flow form state
  const dispute = useMemo(() => {
    return cases.find((c) => c.id === id);
  }, [cases, id]);

  const [refundForm, setRefundForm] = useState<{
    refundType: "full" | "partial";
    amount: number;
    reason: string;
    note: string;
  }>({
    refundType: "full",
    amount: dispute ? dispute.disputedAmount : 0,
    reason: "customer_dispute",
    note: `Dispute settlement for ${dispute?.caseNumber || ""}`,
  });

  if (!dispute) {
    return (
      <div className="mx-auto w-full max-w-5xl py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-zinc-300" />
        <h3 className="mt-3 text-lg font-semibold text-zinc-900">Dispute Case Not Found</h3>
        <p className="mt-1 text-sm text-zinc-500">
          The requested case &ldquo;{id}&rdquo; does not exist.
        </p>
        <Link
          href="/disputes"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#000F24] px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Disputes</span>
        </Link>
      </div>
    );
  }

  const isResolvedOrClosed = dispute.status === "resolved" || dispute.status === "closed";

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    disputeActions.addMessage(
      dispute.id,
      "merchant",
      "FacilPay Merchant Operations",
      replyText.trim()
    );
    setReplyText("");
    showToast("Message sent to customer");
  };

  const handleOpenRefundModal = (type: "full" | "partial") => {
    setRefundForm({
      refundType: type,
      amount: type === "full" ? dispute.disputedAmount : Math.min(dispute.disputedAmount, 100),
      reason: "customer_dispute",
      note: `Dispute settlement for ${dispute.caseNumber}: ${dispute.reasonLabel}`,
    });
    setIsRefundModalOpen(true);
  };

  const handleExecuteRefund = (e: React.FormEvent) => {
    e.preventDefault();
    const refundRef = disputeActions.resolveWithRefund(
      dispute.id,
      refundForm.amount,
      refundForm.note
    );
    setIsRefundModalOpen(false);
    showToast(`Dispute resolved! Refund issued: ${refundRef}`);
  };

  const handleExecuteClose = (e: React.FormEvent) => {
    e.preventDefault();
    disputeActions.updateStatus(dispute.id, "closed", closeNotes);
    setIsCloseModalOpen(false);
    showToast("Dispute marked as closed without refund");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getStatusBadge = (status: DisputeStatus) => {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>Open (Customer Inquired)</span>
          </span>
        );
      case "awaiting_merchant":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
            <Clock className="h-3 w-3 text-blue-600" />
            <span>Awaiting Merchant Action</span>
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Resolved</span>
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">
            <XCircle className="h-3 w-3 text-zinc-500" />
            <span>Closed</span>
          </span>
        );
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-[#000F24] px-4 py-3 text-sm text-white shadow-lg animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-4 w-4 text-[#55C2FF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/disputes"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50"
            title="Back to All Disputes"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-zinc-900">{dispute.caseNumber}</h2>
              {getStatusBadge(dispute.status)}
            </div>
            <p className="text-xs text-zinc-500">
              Dispute Category: <span className="font-semibold text-zinc-700">{dispute.reasonLabel}</span>
            </p>
          </div>
        </div>

        {/* Resolution Actions Header */}
        {!isResolvedOrClosed && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCloseModalOpen(true)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              Close Without Refund
            </button>
            <button
              type="button"
              onClick={() => handleOpenRefundModal("partial")}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              Partial Refund
            </button>
            <button
              type="button"
              onClick={() => handleOpenRefundModal("full")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Issue Full Refund (${dispute.disputedAmount.toFixed(2)})</span>
            </button>
          </div>
        )}
      </div>

      {/* Case Overview Card */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:grid-cols-4">
        <div>
          <span className="text-xs font-semibold uppercase text-zinc-400">Linked Payment</span>
          <div className="mt-1 flex items-center gap-1 font-mono text-xs font-medium text-zinc-900">
            <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
            <Link href={`/payments?q=${dispute.paymentId}`} className="text-[#20a7ee] hover:underline">
              {dispute.paymentId}
            </Link>
          </div>
          <span className="text-[11px] text-zinc-500">Original Amount: ${dispute.paymentAmount.toFixed(2)}</span>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase text-zinc-400">Disputed Amount</span>
          <p className="mt-1 text-base font-bold text-zinc-900">
            ${dispute.disputedAmount.toFixed(2)} {dispute.currency}
          </p>
          <span className="text-[11px] text-zinc-500">Customer claim volume</span>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase text-zinc-400">Customer Details</span>
          <p className="mt-1 truncate text-xs font-medium text-zinc-800" title={dispute.customerEmail}>
            {dispute.customerEmail}
          </p>
          <p className="truncate font-mono text-[11px] text-zinc-400" title={dispute.customerWallet}>
            {dispute.customerWallet}
          </p>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase text-zinc-400">Refund Status</span>
          {dispute.refundId ? (
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>{dispute.refundId}</span>
              </span>
              <p className="text-[11px] text-emerald-600">Settled: ${dispute.refundedAmount?.toFixed(2)}</p>
            </div>
          ) : (
            <p className="mt-1 text-xs text-zinc-500">No refunds issued yet</p>
          )}
        </div>
      </div>

      {/* Resolution Notes Banner if Resolved/Closed */}
      {dispute.resolutionNotes && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Resolution Summary</h4>
              <p className="mt-0.5 text-sm text-emerald-900">{dispute.resolutionNotes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Attachments Section */}
      {dispute.evidenceFiles.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Customer Evidence Files</h4>
          <div className="mt-3 flex flex-wrap gap-3">
            {dispute.evidenceFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700"
              >
                <FileText className="h-4 w-4 text-zinc-400" />
                <span className="font-medium text-zinc-900">{file.name}</span>
                <span className="text-zinc-400">({file.size})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Thread Section */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-zinc-900">Case Message Thread</h3>
          <p className="text-xs text-zinc-500">Direct communication with customer regarding this dispute</p>
        </div>

        <div className="space-y-4 p-6">
          {dispute.messages.map((msg) => {
            const isSystem = msg.sender === "system";
            const isMerchant = msg.sender === "merchant";

            if (isSystem) {
              return (
                <div key={msg.id} className="my-2 flex justify-center">
                  <div className="rounded-full bg-zinc-100 px-4 py-1 text-xs text-zinc-600 border border-zinc-200 flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-zinc-400" />
                    <span>{msg.content}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMerchant ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                  <span className="font-semibold text-zinc-800">{msg.senderName}</span>
                  <span>&bull;</span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div
                  className={`max-w-xl rounded-2xl p-4 text-sm ${
                    isMerchant
                      ? "bg-[#000F24] text-white rounded-tr-none"
                      : "bg-zinc-100 text-zinc-800 rounded-tl-none border border-zinc-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-zinc-200/20 pt-2">
                      {msg.attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs opacity-90">
                          <Paperclip className="h-3 w-3" />
                          <span>{att.name} ({att.size})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input Box */}
        {!isResolvedOrClosed && (
          <form onSubmit={handleSendMessage} className="border-t border-zinc-100 p-4">
            <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response to the customer..."
                className="w-full resize-none border-0 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
              <div className="flex items-center justify-between border-t border-zinc-200 pt-2">
                <button
                  type="button"
                  onClick={() => showToast("Attachment upload simulated")}
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  <span>Attach File</span>
                </button>
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#000F24] px-4 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Reply</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Pre-filled Refund Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-semibold text-zinc-900">
                  Resolve Dispute with Refund ({refundForm.refundType === "full" ? "Full" : "Partial"})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteRefund} className="mt-4 space-y-4">
              <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 space-y-1 border border-zinc-200">
                <div className="flex justify-between">
                  <span>Linked Payment:</span>
                  <strong className="font-mono">{dispute.paymentId}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Customer Wallet:</span>
                  <span className="font-mono truncate max-w-[200px]">{dispute.customerWallet}</span>
                </div>
                <div className="flex justify-between">
                  <span>Original Amount:</span>
                  <strong>${dispute.paymentAmount.toFixed(2)} {dispute.currency}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700">Refund Amount ({dispute.currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={dispute.paymentAmount}
                  required
                  value={refundForm.amount}
                  onChange={(e) =>
                    setRefundForm({ ...refundForm, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-mono font-semibold focus:border-[#20a7ee] focus:outline-none focus:ring-1 focus:ring-[#20a7ee]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700">Resolution Reason</label>
                <select
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-[#20a7ee] focus:outline-none focus:ring-1 focus:ring-[#20a7ee]"
                >
                  <option value="customer_dispute">Customer Dispute Settlement</option>
                  <option value="product_unacceptable">Product Unacceptable / Damaged</option>
                  <option value="product_not_received">Item Not Received</option>
                  <option value="duplicate_payment">Duplicate Payment</option>
                  <option value="fraudulent">Fraudulent Transaction</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700">Resolution Notes (Logged to Case)</label>
                <textarea
                  rows={2}
                  required
                  value={refundForm.note}
                  onChange={(e) => setRefundForm({ ...refundForm, note: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-[#20a7ee] focus:outline-none focus:ring-1 focus:ring-[#20a7ee]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Confirm & Execute Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Without Refund Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-semibold text-zinc-900">Close Case Without Refund</h3>
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteClose} className="mt-4 space-y-4">
              <p className="text-xs text-zinc-500">
                Are you sure you want to close case {dispute.caseNumber}? This indicates the inquiry was resolved mutually without financial deduction.
              </p>
              <div>
                <label className="block text-xs font-medium text-zinc-700">Closing Reason / Notes</label>
                <textarea
                  rows={3}
                  required
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Explain why the case was closed without refund..."
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-[#20a7ee] focus:outline-none focus:ring-1 focus:ring-[#20a7ee]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#000F24] px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Close Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
