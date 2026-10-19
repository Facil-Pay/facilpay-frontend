"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowRight,
  CreditCard,
  Bell,
  X,
  FileQuestion,
} from "lucide-react";
import {
  useDisputes,
  disputeActions,
  DISPUTE_REASON_LABELS,
  type DisputeCase,
  type DisputeReason,
  type DisputeStatus,
} from "@/lib/disputes";

export default function DisputesPage() {
  const { cases, unreadNotificationCount } = useDisputes();

  const [statusFilter, setStatusFilter] = useState<"all" | DisputeStatus>("all");
  const [reasonFilter, setReasonFilter] = useState<"all" | DisputeReason>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (reasonFilter !== "all" && c.reason !== reasonFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchNumber = c.caseNumber.toLowerCase().includes(q);
        const matchEmail = c.customerEmail.toLowerCase().includes(q);
        const matchPayment = c.paymentId.toLowerCase().includes(q);
        const matchWallet = c.customerWallet.toLowerCase().includes(q);
        if (!matchNumber && !matchEmail && !matchPayment && !matchWallet) return false;
      }
      return true;
    });
  }, [cases, statusFilter, reasonFilter, searchQuery]);

  // Aggregate metrics
  const stats = useMemo(() => {
    let openCount = 0;
    let awaitingCount = 0;
    let resolvedCount = 0;
    let totalDisputedUsd = 0;

    for (const c of cases) {
      if (c.status === "open") openCount += 1;
      if (c.status === "awaiting_merchant") awaitingCount += 1;
      if (c.status === "resolved") resolvedCount += 1;
      totalDisputedUsd += c.disputedAmount;
    }

    return { openCount, awaitingCount, resolvedCount, totalDisputedUsd };
  }, [cases]);

  const getStatusBadge = (status: DisputeStatus) => {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <AlertCircle className="h-3 w-3 text-amber-600" />
            <span>Open</span>
          </span>
        );
      case "awaiting_merchant":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
            <Clock className="h-3 w-3 text-blue-600" />
            <span>Awaiting Merchant</span>
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Resolved</span>
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">
            <XCircle className="h-3 w-3 text-zinc-500" />
            <span>Closed</span>
          </span>
        );
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Top Notification Banner if New Disputes */}
      {unreadNotificationCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900">
                New Customer Dispute Opened ({unreadNotificationCount})
              </h4>
              <p className="text-xs text-blue-700">
                A customer has filed a new inquiry requiring merchant review or refund resolution.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => disputeActions.dismissNotification()}
            className="rounded p-1 text-blue-400 hover:text-blue-700"
            title="Dismiss Notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Customer Disputes & Support Cases</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Track customer inquiries, inspect payment-linked evidence, and resolve claims via instant on-chain refunds.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Awaiting Merchant</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{stats.awaitingCount}</p>
          <p className="mt-1 text-xs text-zinc-500">Requires response or refund decision</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Open Cases</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{stats.openCount}</p>
          <p className="mt-1 text-xs text-zinc-500">Customer cases under investigation</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Disputed Value</span>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            ${stats.totalDisputedUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Across all active & historic claims</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Resolved Cases</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{stats.resolvedCount}</p>
          <p className="mt-1 text-xs text-zinc-500">Settled via on-chain refund or closure</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-zinc-100 p-1">
          {(["all", "open", "awaiting_merchant", "resolved", "closed"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
                statusFilter === s ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Reason Dropdown & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter by reason"
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value as "all" | DisputeReason)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 focus:border-[#20a7ee] focus:outline-none focus:ring-1 focus:ring-[#20a7ee]"
          >
            <option value="all">All Dispute Reasons</option>
            {Object.entries(DISPUTE_REASON_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search case, customer, payment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 rounded-md border border-zinc-300 py-1.5 pl-8 pr-3 text-xs placeholder:text-zinc-400 focus:border-[#20a7ee] focus:outline-none focus:ring-1 focus:ring-[#20a7ee]"
            />
          </div>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <tr>
              <th scope="col" className="px-4 py-3.5">Case / Reason</th>
              <th scope="col" className="px-4 py-3.5">Linked Payment</th>
              <th scope="col" className="px-4 py-3.5">Customer</th>
              <th scope="col" className="px-4 py-3.5 text-right">Disputed Amount</th>
              <th scope="col" className="px-4 py-3.5 text-center">Status</th>
              <th scope="col" className="px-4 py-3.5 text-right">Last Updated</th>
              <th scope="col" className="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500">
                  <FileQuestion className="mx-auto h-8 w-8 text-zinc-300" />
                  <p className="mt-2 text-sm font-medium">No dispute cases match your criteria.</p>
                </td>
              </tr>
            ) : (
              filteredCases.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-zinc-50/75">
                  {/* Case / Reason */}
                  <td className="px-4 py-3.5">
                    <Link href={`/disputes/${c.id}`} className="group flex flex-col focus:outline-none">
                      <span className="font-semibold text-zinc-900 group-hover:text-[#20a7ee] transition-colors">
                        {c.caseNumber}
                      </span>
                      <span className="text-xs text-zinc-500">{c.reasonLabel}</span>
                    </Link>
                  </td>

                  {/* Linked Payment */}
                  <td className="px-4 py-3.5 font-mono text-xs">
                    <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-zinc-800">
                      <CreditCard className="h-3 w-3 text-zinc-500" />
                      {c.paymentId}
                    </span>
                    {c.refundId && (
                      <span className="ml-1.5 inline-block text-[11px] text-emerald-600 font-medium">
                        (Refunded: {c.refundId})
                      </span>
                    )}
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-800">{c.customerEmail}</span>
                      <span className="font-mono text-xs text-zinc-400 truncate max-w-[140px]" title={c.customerWallet}>
                        {c.customerWallet}
                      </span>
                    </div>
                  </td>

                  {/* Disputed Amount */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-zinc-900">
                    ${c.disputedAmount.toFixed(2)} {c.currency}
                    {c.disputedAmount < c.paymentAmount && (
                      <span className="block text-[10px] text-zinc-400 font-normal">
                        of ${c.paymentAmount.toFixed(2)}
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-center">
                    {getStatusBadge(c.status)}
                  </td>

                  {/* Last Updated */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-right text-xs text-zinc-500">
                    {new Date(c.updatedAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  {/* Action */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-right">
                    <Link
                      href={`/disputes/${c.id}`}
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-[#20a7ee] hover:bg-blue-50 transition"
                    >
                      <span>View Case</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
