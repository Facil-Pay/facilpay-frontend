"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Scale,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  Mail,
  ShieldCheck,
  TrendingUp,
  Filter,
  X,
} from "lucide-react";
import {
  useSettlements,
  settlementStore,
  generateSettlementBatchesCsv,
  downloadCsv,
  generateSettlementPdf,
  type SettlementBatch,
  type SettlementPeriodType,
  type SettlementStatus,
  type StatementScheduleConfig,
} from "@/lib/settlements";

export default function SettlementsPage() {
  const { batches, schedule } = useSettlements();

  const [cadenceFilter, setCadenceFilter] = useState<"all" | SettlementPeriodType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | SettlementStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Schedule modal form state
  const [scheduleForm, setScheduleForm] = useState<StatementScheduleConfig>(schedule);

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (cadenceFilter !== "all" && b.periodType !== cadenceFilter) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchId = b.id.toLowerCase().includes(q);
        const matchLabel = b.periodLabel.toLowerCase().includes(q);
        const matchAccount = b.settlementAccount.toLowerCase().includes(q);
        if (!matchId && !matchLabel && !matchAccount) return false;
      }
      return true;
    });
  }, [batches, cadenceFilter, statusFilter, searchQuery]);

  // Aggregate summary metrics
  const totals = useMemo(() => {
    let gross = 0;
    let refunds = 0;
    let fees = 0;
    let net = 0;
    let onChainSettled = 0;
    let mismatches = 0;

    for (const b of filteredBatches) {
      gross += b.gross;
      refunds += b.refunds;
      fees += b.fees;
      net += b.net;
      onChainSettled += b.onChainSettled;
      if (b.status === "mismatch") mismatches += 1;
    }

    return { gross, refunds, fees, net, onChainSettled, mismatches };
  }, [filteredBatches]);

  const handleExportAllCsv = () => {
    const csv = generateSettlementBatchesCsv(filteredBatches);
    downloadCsv(csv, `facilpay_settlements_${new Date().toISOString().split("T")[0]}.csv`);
    showToast("Settlement summary CSV exported successfully");
  };

  const handleDownloadBatchPdf = (batch: SettlementBatch, e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = generateSettlementPdf(batch);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `facilpay_settlement_${batch.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`PDF Statement downloaded for ${batch.id}`);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    settlementStore.set((s) => ({
      ...s,
      schedule: {
        ...scheduleForm,
        updatedAt: new Date().toISOString(),
      },
    }));
    setIsScheduleModalOpen(false);
    showToast("Monthly statement email automation updated successfully");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-[#000F24] px-4 py-3 text-sm text-white shadow-lg animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-4 w-4 text-[#55C2FF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Settlement Reports & Reconciliation</h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              Soroban Verified
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Reconcile daily and weekly payout batches against on-chain Stellar transactions, escrow releases, and ledger balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            <Mail className="h-4 w-4 text-zinc-500" />
            <span>Schedule Statements</span>
            {schedule.enabled && (
              <span className="h-2 w-2 rounded-full bg-emerald-500" title="Schedule active" />
            )}
          </button>

          <button
            type="button"
            onClick={handleExportAllCsv}
            disabled={filteredBatches.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-[#000F24] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-[#55C2FF]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Gross Volume</span>
            <TrendingUp className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            ${totals.gross.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Across {filteredBatches.length} settlement batches</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Refunds Deducted</span>
            <RotateCcwIcon className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            -${totals.refunds.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Customer dispute & return settlements</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Expected Net</span>
            <Scale className="h-4 w-4 text-[#20a7ee]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            ${totals.net.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Fees: -${totals.fees.toFixed(2)} USDC</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Reconciliation Health</span>
            {totals.mismatches > 0 ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            )}
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {totals.mismatches === 0 ? "100% Balanced" : `${totals.mismatches} Discrepancy`}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {totals.mismatches === 0
              ? "All on-chain ledgers match internal balances"
              : "Review highlighted batches below"}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Cadence Pills */}
        <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => setCadenceFilter("all")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              cadenceFilter === "all" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            All Cadences
          </button>
          <button
            type="button"
            onClick={() => setCadenceFilter("daily")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              cadenceFilter === "daily" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Daily Batches
          </button>
          <button
            type="button"
            onClick={() => setCadenceFilter("weekly")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              cadenceFilter === "weekly" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Weekly Batches
          </button>
        </div>

        {/* Status Dropdown & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter by reconciliation status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | SettlementStatus)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 focus:border-[#20a7ee] focus:outline-none focus:ring-1 focus:ring-[#20a7ee]"
          >
            <option value="all">All Reconciliation Statuses</option>
            <option value="balanced">Balanced Only</option>
            <option value="mismatch">Mismatches / Discrepancies</option>
          </select>

          <input
            type="text"
            placeholder="Search batch ID or period..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs placeholder:text-zinc-400 focus:border-[#20a7ee] focus:outline-none focus:ring-1 focus:ring-[#20a7ee]"
          />
        </div>
      </div>

      {/* Settlements Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <tr>
              <th scope="col" className="px-4 py-3.5">Batch / Period</th>
              <th scope="col" className="px-4 py-3.5">Cadence</th>
              <th scope="col" className="px-4 py-3.5 text-right">Gross</th>
              <th scope="col" className="px-4 py-3.5 text-right">Refunds</th>
              <th scope="col" className="px-4 py-3.5 text-right">Fees</th>
              <th scope="col" className="px-4 py-3.5 text-right">Expected Net</th>
              <th scope="col" className="px-4 py-3.5 text-right">On-Chain Settled</th>
              <th scope="col" className="px-4 py-3.5 text-center">Status</th>
              <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredBatches.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-zinc-500">
                  <Scale className="mx-auto h-8 w-8 text-zinc-300" />
                  <p className="mt-2 text-sm font-medium">No settlement batches match your filter criteria.</p>
                </td>
              </tr>
            ) : (
              filteredBatches.map((b) => {
                const isMismatch = b.status === "mismatch";
                return (
                  <tr
                    key={b.id}
                    className={`transition-colors hover:bg-zinc-50/75 ${
                      isMismatch ? "bg-amber-50/30" : ""
                    }`}
                  >
                    {/* Batch ID & Period */}
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/reports/settlements/${b.id}`}
                        className="group flex flex-col focus:outline-none"
                      >
                        <span className="font-semibold text-zinc-900 group-hover:text-[#20a7ee] transition-colors">
                          {b.periodLabel}
                        </span>
                        <span className="font-mono text-xs text-zinc-500">{b.id}</span>
                      </Link>
                    </td>

                    {/* Cadence */}
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize text-zinc-700">
                        {b.periodType}
                      </span>
                    </td>

                    {/* Gross */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium text-zinc-900">
                      ${b.gross.toFixed(2)}
                    </td>

                    {/* Refunds */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-zinc-600">
                      {b.refunds > 0 ? `-$${b.refunds.toFixed(2)}` : "$0.00"}
                    </td>

                    {/* Fees */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-zinc-600">
                      -${b.fees.toFixed(2)}
                    </td>

                    {/* Expected Net */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-zinc-900">
                      ${b.net.toFixed(2)}
                    </td>

                    {/* On-Chain Settled */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-mono font-medium text-zinc-900">
                      ${b.onChainSettled.toFixed(2)}
                    </td>

                    {/* Status Badge */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-center">
                      {isMismatch ? (
                        <div className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          <span>Mismatch (${Math.abs(b.variance).toFixed(2)})</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Balanced</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleDownloadBatchPdf(b, e)}
                          title="Download PDF Statement"
                          className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/reports/settlements/${b.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#20a7ee] hover:underline"
                        >
                          <span>Drill down</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Schedule Statement Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#20a7ee]" />
                <h3 className="text-base font-semibold text-zinc-900">Schedule Settlement Statements</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700">Recipient Email</label>
                <input
                  type="email"
                  required
                  value={scheduleForm.email}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, email: e.target.value })}
                  placeholder="finance@yourcompany.com"
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-[#20a7ee] focus:outline-none focus:ring-1 focus:ring-[#20a7ee]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700">Cadence</label>
                <select
                  value={scheduleForm.frequency}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      frequency: e.target.value as StatementScheduleConfig["frequency"],
                    })
                  }
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-[#20a7ee] focus:outline-none focus:ring-1 focus:ring-[#20a7ee]"
                >
                  <option value="daily">Daily Statements (Every morning)</option>
                  <option value="weekly">Weekly Statements (Every Monday)</option>
                  <option value="monthly">Monthly Reconciliation (1st of Month)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700">Attachment Format</label>
                <select
                  value={scheduleForm.format}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      format: e.target.value as StatementScheduleConfig["format"],
                    })
                  }
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-[#20a7ee] focus:outline-none focus:ring-1 focus:ring-[#20a7ee]"
                >
                  <option value="both">Both PDF Statement & CSV Data</option>
                  <option value="pdf">PDF Statement Only</option>
                  <option value="csv">CSV Raw Data Only</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notifyMismatch"
                  checked={scheduleForm.notifyOnMismatch}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, notifyOnMismatch: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-[#20a7ee] focus:ring-[#20a7ee]"
                />
                <label htmlFor="notifyMismatch" className="text-xs text-zinc-600">
                  Send immediate priority alert if an on-chain discrepancy is flagged
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#000F24] px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RotateCcwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
