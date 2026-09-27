"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Download, Loader2, RotateCcw, RotateCw, Search } from "lucide-react";
import ExportModal from "@/components/ExportModal";
import { useToast } from "@/components/ui/toast";
import { useWallet } from "@/components/wallet/wallet-provider";
import { useRefund, useRefundList, useRefundSummary, useRetryRefund } from "@/lib/api/hooks/useRefunds";
import type { ExportColumn } from "@/lib/types";
import type { Refund, RefundListParams, RefundStatus } from "@/lib/types/refund";
import { RefundDetailDrawer } from "./RefundDetailDrawer";
import { RefundStatusBadge } from "./RefundStatusBadge";
import {
  REFUND_ASSETS,
  REFUND_STATUSES,
  REFUND_STATUS_LABEL,
  formatAmount,
  formatDateTime,
  formatReason,
} from "./refund-format";

const PAGE_SIZE = 20;
const FILTER_KEYS = ["status", "asset", "from", "to", "q"] as const;

const EXPORT_COLUMNS: ExportColumn<Refund>[] = [
  { key: "id", label: "Refund ID", selected: true },
  { key: "paymentId", label: "Original Payment ID", selected: true },
  { key: "amount", label: "Amount", selected: true },
  { key: "currency", label: "Asset", selected: true },
  { key: "status", label: "Status", selected: true },
  { key: "reason", label: "Reason", selected: true },
  { key: "initiatedBy", label: "Initiated By", selected: true },
  { key: "createdAt", label: "Created (ISO 8601)", selected: true },
  { key: "txHash", label: "Transaction Hash", selected: true },
];

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

export function RefundsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { isConnected, connect, signTransaction } = useWallet();

  // ── Filters live in the URL so they survive reloads and can be shared ──────
  const filters: RefundListParams = useMemo(
    () => ({
      status: (searchParams.get("status") as RefundStatus | null) ?? undefined,
      asset: searchParams.get("asset") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      q: searchParams.get("q") ?? undefined,
    }),
    [searchParams],
  );
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const selectedId = searchParams.get("refund");

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      // Changing a filter resets pagination
      if (Object.keys(updates).some((key) => (FILTER_KEYS as readonly string[]).includes(key))) {
        next.delete("page");
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Debounce the free-text search before writing it to the URL
  const [searchDraft, setSearchDraft] = useState(filters.q ?? "");
  useEffect(() => {
    if (searchDraft === (filters.q ?? "")) return;
    const timeout = setTimeout(() => updateParams({ q: searchDraft.trim() || undefined }), 300);
    return () => clearTimeout(timeout);
  }, [searchDraft, filters.q, updateParams]);

  const listQuery = useRefundList({ ...filters, page, pageSize: PAGE_SIZE });
  const summaryQuery = useRefundSummary(filters);
  const refunds = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  const selectedFromList = refunds.find((refund) => refund.id === selectedId);
  const detailQuery = useRefund(selectedId && !selectedFromList ? selectedId : undefined);
  const selectedRefund = selectedFromList ?? detailQuery.data ?? null;

  const retry = useRetryRefund(signTransaction);
  const handleRetry = async (refund: Refund) => {
    try {
      if (!isConnected) await connect();
      await retry.mutateAsync(refund.id);
      toast(`Refund ${refund.reference} resubmitted`, "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Retry failed", "error");
    }
  };

  const hasFilters = FILTER_KEYS.some((key) => filters[key]);
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Refunds</h2>
          <p className="mt-1 text-sm text-zinc-500">Track every refund you have issued and recover failed ones.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsExportOpen(true)}
          disabled={refunds.length === 0}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-[#000F24] px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Summary header */}
      <section aria-label="Refund summary" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total refunded"
          loading={summaryQuery.isLoading}
          value={
            summaryQuery.data
              ? summaryQuery.data.totalRefunded.toLocaleString(undefined, {
                  style: "currency",
                  currency: summaryQuery.data.currency,
                })
              : "—"
          }
        />
        <SummaryCard
          label="Refund rate"
          hint="% of payment volume"
          loading={summaryQuery.isLoading}
          value={summaryQuery.data ? `${(summaryQuery.data.refundRate * 100).toFixed(2)}%` : "—"}
        />
        <SummaryCard
          label="Pending refunds"
          loading={summaryQuery.isLoading}
          value={summaryQuery.data ? String(summaryQuery.data.pendingCount) : "—"}
        />
      </section>

      {/* Filters */}
      <section aria-label="Filters" className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="relative lg:col-span-2">
            <span className="sr-only">Search refunds</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Refund ID, payment ID or tx hash"
              className={`${inputClass} pl-9`}
            />
          </label>
          <select
            aria-label="Status"
            value={filters.status ?? ""}
            onChange={(event) => updateParams({ status: event.target.value || undefined })}
            className={inputClass}
          >
            <option value="">All statuses</option>
            {REFUND_STATUSES.map((status) => (
              <option key={status} value={status}>
                {REFUND_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
          <select
            aria-label="Asset"
            value={filters.asset ?? ""}
            onChange={(event) => updateParams({ asset: event.target.value || undefined })}
            className={inputClass}
          >
            <option value="">All assets</option>
            {REFUND_ASSETS.map((asset) => (
              <option key={asset} value={asset}>
                {asset}
              </option>
            ))}
          </select>
          <input
            type="date"
            aria-label="From date"
            value={filters.from ?? ""}
            max={filters.to}
            onChange={(event) => updateParams({ from: event.target.value || undefined })}
            className={inputClass}
          />
          <input
            type="date"
            aria-label="To date"
            value={filters.to ?? ""}
            min={filters.from}
            onChange={(event) => updateParams({ to: event.target.value || undefined })}
            className={inputClass}
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearchDraft("");
              updateParams({ status: undefined, asset: undefined, from: undefined, to: undefined, q: undefined });
            }}
            className="mt-3 text-xs font-medium text-sky-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {listQuery.isLoading ? (
          <div className="space-y-2 p-4" aria-busy="true" aria-label="Loading refunds">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded bg-zinc-100" />
            ))}
          </div>
        ) : listQuery.isError ? (
          <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm font-medium text-zinc-900">Couldn&apos;t load refunds</p>
            <p className="text-xs text-zinc-500">{listQuery.error.message}</p>
            <button
              type="button"
              onClick={() => void listQuery.refetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
            >
              <RotateCw className="h-3.5 w-3.5" /> Try again
            </button>
          </div>
        ) : refunds.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <RotateCcw className="h-8 w-8 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-900">
              {hasFilters ? "No refunds match these filters" : "No refunds yet"}
            </p>
            <p className="text-xs text-zinc-500">
              {hasFilters ? "Try adjusting or clearing the filters." : "Refunds you issue from a payment will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Refund ID</th>
                  <th scope="col" className="px-4 py-3">Original payment</th>
                  <th scope="col" className="px-4 py-3">Amount</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Reason</th>
                  <th scope="col" className="px-4 py-3">Initiated by</th>
                  <th scope="col" className="px-4 py-3">Created</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {refunds.map((refund) => (
                  <tr
                    key={refund.id}
                    onClick={() => updateParams({ refund: refund.id })}
                    className="cursor-pointer hover:bg-zinc-50"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          updateParams({ refund: refund.id });
                        }}
                        className="font-mono text-xs font-semibold text-zinc-900 hover:text-sky-600"
                      >
                        {refund.reference || refund.id}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/payments/${refund.paymentId}`}
                        onClick={(event) => event.stopPropagation()}
                        className="font-mono text-xs text-sky-600 hover:underline"
                      >
                        {refund.paymentId.slice(0, 16)}…
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">
                      {formatAmount(refund.amount, refund.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <RefundStatusBadge status={refund.status} />
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-zinc-600">{formatReason(refund.reason)}</td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-zinc-600">{refund.initiatedBy}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatDateTime(refund.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {refund.status === "failed" && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleRetry(refund);
                          }}
                          disabled={retry.isPending && retry.variables === refund.id}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          {retry.isPending && retry.variables === refund.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCw className="h-3 w-3" />
                          )}
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500">
            <span>
              Page {meta.page} of {meta.totalPages} · {meta.total} refunds
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!meta.hasPrevPage}
                onClick={() => updateParams({ page: String(page - 1) })}
                className="rounded-md border border-zinc-200 px-3 py-1 hover:bg-zinc-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!meta.hasNextPage}
                onClick={() => updateParams({ page: String(page + 1) })}
                className="rounded-md border border-zinc-200 px-3 py-1 hover:bg-zinc-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      <RefundDetailDrawer
        refund={selectedRefund}
        onClose={() => updateParams({ refund: undefined })}
        onRetry={(refund) => void handleRetry(refund)}
        isRetrying={retry.isPending}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        type="refunds"
        title="Refunds"
        data={refunds}
        columns={EXPORT_COLUMNS}
        filterStartDate={filters.from}
        filterEndDate={filters.to}
        filterSummary={
          [
            filters.status && `Status: ${REFUND_STATUS_LABEL[filters.status]}`,
            filters.asset && `Asset: ${filters.asset}`,
            filters.from && filters.to && `${filters.from} to ${filters.to}`,
          ]
            .filter(Boolean)
            .join(" • ") || "All refunds"
        }
      />
    </div>
  );
}

function SummaryCard({ label, value, hint, loading }: { label: string; value: string; hint?: string; loading: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      {loading ? (
        <div className="mt-2 h-7 w-24 animate-pulse rounded bg-zinc-100" />
      ) : (
        <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
      )}
      {hint && <p className="mt-0.5 text-[11px] text-zinc-400">{hint}</p>}
    </div>
  );
}
