"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Scale,
  CreditCard,
  Coins,
  Copy,
  Check,
} from "lucide-react";
import {
  useSettlements,
  generateSingleBatchCsv,
  downloadCsv,
  generateSettlementPdf,
  type SettlementBatch,
} from "@/lib/settlements";

interface PageProps {
  params: Promise<{ batchId: string }>;
}

export default function BatchDrilldownPage({ params }: PageProps) {
  const { batchId } = use(params);
  const { batches } = useSettlements();

  const [activeTab, setActiveTab] = useState<"payments" | "transactions">("payments");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const batch = useMemo(() => {
    return batches.find((b) => b.id === batchId);
  }, [batches, batchId]);

  if (!batch) {
    return (
      <div className="mx-auto w-full max-w-5xl py-12 text-center">
        <Scale className="mx-auto h-12 w-12 text-zinc-300" />
        <h3 className="mt-3 text-lg font-semibold text-zinc-900">Settlement Batch Not Found</h3>
        <p className="mt-1 text-sm text-zinc-500">
          The requested settlement batch &ldquo;{batchId}&rdquo; does not exist or has been archived.
        </p>
        <Link
          href="/reports/settlements"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#000F24] px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Settlements</span>
        </Link>
      </div>
    );
  }

  const isMismatch = batch.status === "mismatch";

  const handleDownloadCsv = () => {
    const csv = generateSingleBatchCsv(batch);
    downloadCsv(csv, `facilpay_settlement_${batch.id}.csv`);
    showToast("Batch breakdown CSV exported");
  };

  const handleDownloadPdf = () => {
    const blob = generateSettlementPdf(batch);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `facilpay_statement_${batch.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("PDF Statement downloaded");
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-[#000F24] px-4 py-3 text-sm text-white shadow-lg animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-4 w-4 text-[#55C2FF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/reports/settlements"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50"
            title="Back to All Settlements"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900">{batch.periodLabel}</h2>
              <span className="font-mono text-xs text-zinc-500">({batch.id})</span>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium uppercase text-zinc-700">
                {batch.periodType}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Settlement Target: <span className="font-mono">{batch.settlementAccount}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            <FileText className="h-4 w-4 text-[#20a7ee]" />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 rounded-lg bg-[#000F24] px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
          >
            <Download className="h-4 w-4 text-[#55C2FF]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Discrepancy Alert Banner if Mismatch */}
      {isMismatch && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900">Reconciliation Mismatch Detected</h4>
              <p className="mt-1 text-xs text-amber-800">
                {batch.discrepancyReason ||
                  "A variance was identified between calculated expected net revenue and the on-chain Soroban release amount."}
              </p>
              <div className="mt-2 flex items-center gap-4 text-xs font-mono">
                <span>Expected Net: <strong>${batch.net.toFixed(2)} {batch.asset}</strong></span>
                <span>On-Chain Settled: <strong>${batch.onChainSettled.toFixed(2)} {batch.asset}</strong></span>
                <span className="rounded bg-amber-200 px-1.5 py-0.5 font-bold text-amber-900">
                  Variance Delta: ${Math.abs(batch.variance).toFixed(2)} {batch.asset}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Formula Reconciliation Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-[#20a7ee]" />
            <h3 className="text-sm font-semibold text-zinc-900">Financial Ledger Equation</h3>
          </div>
          {isMismatch ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              <span>Variance (${Math.abs(batch.variance).toFixed(2)})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>Balanced (0.00 Delta)</span>
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5 text-center">
          <div className="rounded-lg bg-zinc-50 p-3">
            <span className="text-[11px] font-semibold uppercase text-zinc-500">Gross Volume</span>
            <p className="mt-1 text-lg font-bold text-zinc-900">${batch.gross.toFixed(2)}</p>
            <span className="text-[10px] text-zinc-400">Total processed</span>
          </div>

          <div className="rounded-lg bg-zinc-50 p-3">
            <span className="text-[11px] font-semibold uppercase text-zinc-500">Refunds</span>
            <p className="mt-1 text-lg font-bold text-zinc-700">-${batch.refunds.toFixed(2)}</p>
            <span className="text-[10px] text-zinc-400">Deductions</span>
          </div>

          <div className="rounded-lg bg-zinc-50 p-3">
            <span className="text-[11px] font-semibold uppercase text-zinc-500">Fees</span>
            <p className="mt-1 text-lg font-bold text-zinc-700">-${batch.fees.toFixed(2)}</p>
            <span className="text-[10px] text-zinc-400">Platform + Stellar</span>
          </div>

          <div className="rounded-lg bg-blue-50/70 p-3 border border-blue-100">
            <span className="text-[11px] font-semibold uppercase text-blue-700">Expected Net</span>
            <p className="mt-1 text-lg font-bold text-blue-900">${batch.net.toFixed(2)}</p>
            <span className="text-[10px] text-blue-600 font-mono">Gross - Ref - Fees</span>
          </div>

          <div className={`rounded-lg p-3 border ${isMismatch ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
            <span className={`text-[11px] font-semibold uppercase ${isMismatch ? "text-amber-800" : "text-emerald-800"}`}>
              On-Chain Settled
            </span>
            <p className={`mt-1 text-lg font-bold font-mono ${isMismatch ? "text-amber-900" : "text-emerald-900"}`}>
              ${batch.onChainSettled.toFixed(2)}
            </p>
            <span className={`text-[10px] font-mono ${isMismatch ? "text-amber-700 font-bold" : "text-emerald-600"}`}>
              {batch.variance === 0 ? "Exact Match" : `Delta: $${batch.variance.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs: Payments vs On-Chain Transactions */}
      <div className="space-y-4">
        <div className="flex border-b border-zinc-200">
          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              activeTab === "payments"
                ? "border-[#20a7ee] text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Payments Included</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
              {batch.payments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              activeTab === "transactions"
                ? "border-[#20a7ee] text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Coins className="h-4 w-4" />
            <span>On-Chain Stellar Transactions</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
              {batch.transactions.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Payments Table */}
        {activeTab === "payments" && (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Payment ID</th>
                  <th scope="col" className="px-4 py-3">Customer Email</th>
                  <th scope="col" className="px-4 py-3">Customer Wallet</th>
                  <th scope="col" className="px-4 py-3 text-right">Amount</th>
                  <th scope="col" className="px-4 py-3 text-right">Fee</th>
                  <th scope="col" className="px-4 py-3 text-center">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {batch.payments.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-zinc-50/75">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-zinc-900">
                      {p.id}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{p.customerEmail}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{p.customerWallet}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-zinc-900">
                      ${p.amount.toFixed(2)} {p.asset}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-zinc-500">
                      -${p.fee.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                          p.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-zinc-500">
                      {new Date(p.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: On-Chain Transactions Table */}
        {activeTab === "transactions" && (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Transaction Hash</th>
                  <th scope="col" className="px-4 py-3">Soroban Contract Invocation</th>
                  <th scope="col" className="px-4 py-3">Ledger Sequence</th>
                  <th scope="col" className="px-4 py-3 text-right">Settled Amount</th>
                  <th scope="col" className="px-4 py-3 text-right">Network Fee</th>
                  <th scope="col" className="px-4 py-3 text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {batch.transactions.map((tx) => (
                  <tr key={tx.txHash} className="transition-colors hover:bg-zinc-50/75">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-800">
                        <span className="truncate max-w-xs">{tx.txHash}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(tx.txHash)}
                          className="rounded p-1 text-zinc-400 hover:text-zinc-600"
                          title="Copy Tx Hash"
                        >
                          {copiedHash === tx.txHash ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-xs font-semibold text-blue-700 border border-blue-200">
                        {tx.contractCall}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-zinc-700">
                      #{tx.ledger}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-mono font-semibold text-zinc-900">
                      ${tx.amount.toFixed(2)} {tx.asset}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-mono text-xs text-zinc-500">
                      {tx.fee.toFixed(5)} XLM
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <a
                        href={tx.stellarExpertUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#20a7ee] hover:underline"
                      >
                        <span>Stellar Expert</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
