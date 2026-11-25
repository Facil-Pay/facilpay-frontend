"use client";

import { useState } from "react";
import {
  useUnmatchedPayments,
  manualMatch,
  refundToSender,
  pendingCount,
  type UnmatchedPayment,
} from "@/lib/unmatched-payments";
import { StrKey } from "@/lib/stellar/strkey";

// ─── Sample search data for manual matching ───────────────────────────────────

type MatchTarget = {
  type: "payment_link" | "invoice" | "customer";
  id: string;
  label: string;
};

const AVAILABLE_TARGETS: MatchTarget[] = [
  { type: "payment_link", id: "pl_001", label: "Payment Link — Shop Checkout $150" },
  { type: "payment_link", id: "pl_002", label: "Payment Link — SaaS Monthly" },
  { type: "invoice", id: "inv_001", label: "Invoice INV-2026-00042 — $75.50" },
  { type: "invoice", id: "inv_002", label: "Invoice INV-2026-00043 — $200.00" },
  { type: "customer", id: "cust_001", label: "Customer — alice@example.com" },
  { type: "customer", id: "cust_002", label: "Customer — bob@example.com" },
];

// ─── Match modal ──────────────────────────────────────────────────────────────

function ManualMatchModal({
  payment,
  onClose,
}: {
  payment: UnmatchedPayment;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MatchTarget | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const filtered = AVAILABLE_TARGETS.filter((t) =>
    t.label.toLowerCase().includes(search.toLowerCase()),
  );

  const handleConfirm = () => {
    if (!selected) return;
    manualMatch(payment.id, selected);
    setConfirmed(true);
    setTimeout(onClose, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Manual match payment"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-zinc-900">Manual match</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Link this payment ({payment.amount} {payment.asset} from{" "}
          <code className="font-mono text-xs">{StrKey.truncateAddress(payment.senderAddress)}</code>) to an
          existing record.
        </p>

        <input
          type="search"
          placeholder="Search payment links, invoices, customers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          aria-label="Search match targets"
        />

        <ul className="max-h-52 overflow-y-auto divide-y divide-zinc-100 rounded-lg border border-zinc-200">
          {filtered.map((target) => (
            <li key={target.id}>
              <button
                type="button"
                onClick={() => setSelected(target)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-zinc-50 ${
                  selected?.id === target.id ? "bg-sky-50 font-semibold text-sky-800" : "text-zinc-700"
                }`}
              >
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    target.type === "payment_link"
                      ? "bg-blue-100 text-blue-700"
                      : target.type === "invoice"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-teal-100 text-teal-700"
                  }`}
                >
                  {target.type.replace("_", " ")}
                </span>
                {target.label}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-zinc-400">No results.</li>
          )}
        </ul>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={handleConfirm}
            className="rounded-lg bg-[#000F24] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-zinc-800"
          >
            {confirmed ? "✓ Matched!" : "Confirm match"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Refund modal ─────────────────────────────────────────────────────────────

function RefundModal({
  payment,
  onClose,
}: {
  payment: UnmatchedPayment;
  onClose: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidAddress = StrKey.isValidAddress(payment.senderAddress);

  const handleRefund = async () => {
    setLoading(true);
    // Simulate async submission
    await new Promise((r) => setTimeout(r, 600));
    const mockTxHash = `refund_${Date.now().toString(16)}`;
    refundToSender(payment.id, mockTxHash);
    setConfirmed(true);
    setLoading(false);
    setTimeout(onClose, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Refund to sender"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-zinc-900">Refund to sender</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Return{" "}
          <strong>
            {payment.amount} {payment.asset}
          </strong>{" "}
          to the originating address.
        </p>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-zinc-500">Destination</span>
            <code className="font-mono text-xs text-zinc-700">
              {StrKey.truncateAddress(payment.senderAddress, 8, 8)}
            </code>
          </div>
          <div className="mt-1 flex justify-between gap-2">
            <span className="text-zinc-500">Amount</span>
            <span className="font-semibold">
              {payment.amount} {payment.asset}
            </span>
          </div>
        </div>

        {!isValidAddress && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            Warning: the sender address does not appear to be a valid Stellar address. Proceed with
            caution.
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleRefund}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-rose-700"
          >
            {confirmed ? "✓ Refund initiated" : loading ? "Sending…" : "Refund to sender"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type ModalState =
  | { kind: "none" }
  | { kind: "match"; payment: UnmatchedPayment }
  | { kind: "refund"; payment: UnmatchedPayment };

export default function UnmatchedPaymentsPage() {
  const allItems = useUnmatchedPayments();
  const pending = allItems.filter((p) => p.status === "pending");
  const resolved = allItems.filter((p) => p.status !== "pending");
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">
            Needs attention
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-950">Unmatched payments inbox</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Incoming Stellar payments with missing or unrecognised memos that could not be automatically
            matched.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
            aria-live="polite"
            aria-label={`${pending.length} unmatched payments pending`}
          >
            {pending.length} pending
          </span>
        </div>
      </header>

      {/* ── Pending inbox ── */}
      {pending.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center">
          <p className="text-2xl">🎉</p>
          <p className="mt-2 font-medium text-zinc-700">Inbox clear</p>
          <p className="mt-1 text-sm text-zinc-500">All incoming payments have been matched.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3">Sender address</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Asset</th>
                <th className="px-5 py-3">Memo</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Tx hash</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pending.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/60">
                  <td className="px-5 py-4 font-mono text-xs text-zinc-700">
                    {StrKey.truncateAddress(item.senderAddress, 8, 8)}
                  </td>
                  <td className="px-5 py-4 font-semibold tabular-nums text-zinc-900">
                    {item.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">{item.asset}</td>
                  <td className="px-5 py-4">
                    {item.rawMemo ? (
                      <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700">
                        {item.rawMemo}
                      </code>
                    ) : (
                      <span className="text-xs text-zinc-400 italic">No memo</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-zinc-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-sky-600">
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${item.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {item.txHash.slice(0, 8)}…
                    </a>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setModal({ kind: "match", payment: item })}
                        className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100"
                      >
                        Manual match
                      </button>
                      <button
                        type="button"
                        onClick={() => setModal({ kind: "refund", payment: item })}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        Refund to sender
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Resolved items ── */}
      {resolved.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Recently resolved</h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-3">Sender</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Resolution</th>
                  <th className="px-5 py-3">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {resolved.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-600">
                      {StrKey.truncateAddress(item.senderAddress)}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-zinc-700">
                      {item.amount} {item.asset}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                          item.status === "matched"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-zinc-500">
                      {item.status === "matched" && item.matchedTo
                        ? `${item.matchedTo.type}: ${item.matchedTo.label}`
                        : item.refundTxHash
                        ? `Tx: ${item.refundTxHash.slice(0, 12)}…`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Modals ── */}
      {modal.kind === "match" && (
        <ManualMatchModal
          payment={modal.payment}
          onClose={() => setModal({ kind: "none" })}
        />
      )}
      {modal.kind === "refund" && (
        <RefundModal
          payment={modal.payment}
          onClose={() => setModal({ kind: "none" })}
        />
      )}
    </div>
  );
}
