"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, CreditCard, RotateCcw, Search } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useFormat } from "@/lib/i18n/use-format";
import RequestLogDetailDrawer from "@/components/developers/RequestLogDetailDrawer";
import {
  DEFAULT_REQUEST_LOG_FILTERS,
  REQUEST_LOG_PAGE_SIZE,
  filterRequestLogs,
  getRequestLogKeys,
  getStoredRequestLogs,
  paginateRequestLogs,
  statusClass,
  statusText,
  type ApiRequestLog,
  type RequestLogFilters,
  type RequestStatusClass,
} from "@/lib/api-request-logs";

const STATUS_FILTER_OPTIONS: { value: RequestStatusClass | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "2xx", label: "Success (2xx)" },
  { value: "4xx", label: "Client error (4xx)" },
  { value: "5xx", label: "Server error (5xx)" },
];

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
  POST: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  PUT: "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300",
  PATCH: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  DELETE: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
};

const STATUS_BADGE_STYLES: Record<RequestStatusClass, string> = {
  "2xx": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  "4xx": "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  "5xx": "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
};

const inputClass =
  "rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-800 focus:border-sky-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";

export default function ApiRequestLogsView() {
  const f = useFormat();
  const [logs, setLogs] = useState<ApiRequestLog[] | null>(null);
  const [filters, setFilters] = useState<RequestLogFilters>(DEFAULT_REQUEST_LOG_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ApiRequestLog | null>(null);

  // Load the merchant's recent requests. Mirrors the async feel of the other
  // developer tools so the table can render skeletons while loading.
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) setLogs(getStoredRequestLogs());
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const keyOptions = useMemo(() => (logs ? getRequestLogKeys(logs) : []), [logs]);

  const filteredLogs = useMemo(
    () => (logs ? filterRequestLogs(logs, filters) : []),
    [logs, filters]
  );

  const paginated = useMemo(
    () => paginateRequestLogs(filteredLogs, page, REQUEST_LOG_PAGE_SIZE),
    [filteredLogs, page]
  );

  const updateFilters = (updates: Partial<RequestLogFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setPage(1);
  };

  const isLoading = logs === null;
  const hasFilters =
    filters.statusClass !== "all" || filters.keyId !== "all" || filters.path.trim() !== "";

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs */}
      <div className="flex w-fit flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/developers/api-keys"
          className="rounded-lg px-3 py-1.5 font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          API Keys
        </Link>
        <Link
          href="/developers/events"
          className="rounded-lg px-3 py-1.5 font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          Event Catalog
        </Link>
        <Link
          href="/developers/logs"
          className="rounded-lg bg-[#000F24] px-3 py-1.5 font-semibold text-white shadow-sm dark:bg-[#55C2FF] dark:text-black"
        >
          Request Logs
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          API Request Logs
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Review the most recent requests made with your API keys to debug integrations.
          Sensitive headers and fields are redacted.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-zinc-500">Status</span>
            <select
              aria-label="Filter by status class"
              value={filters.statusClass}
              onChange={(event) =>
                updateFilters({ statusClass: event.target.value as RequestLogFilters["statusClass"] })
              }
              className={cn(inputClass, "cursor-pointer")}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-zinc-500">Key</span>
            <select
              aria-label="Filter by API key"
              value={filters.keyId}
              onChange={(event) => updateFilters({ keyId: event.target.value })}
              className={cn(inputClass, "max-w-[220px] cursor-pointer")}
            >
              <option value="all">All keys</option>
              {keyOptions.map((option) => (
                <option key={option.keyId} value={option.keyId}>
                  {option.keyName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="relative block">
          <span className="sr-only">Filter by path</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Filter by path, e.g. /v1/payments"
            value={filters.path}
            onChange={(event) => updateFilters({ path: event.target.value })}
            className={cn(inputClass, "w-full pl-8 lg:w-72")}
          />
        </label>
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        {isLoading ? (
          <div className="space-y-2 p-4" aria-busy="true" aria-label="Loading API request logs">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={<Activity />}
            title={hasFilters ? "No requests match these filters" : "No API requests yet"}
            description={
              hasFilters
                ? "Try adjusting or clearing the filters to see more requests."
                : "Requests made with your API keys will appear here."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50/70 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40">
                <tr>
                  <th scope="col" className="px-4 py-3">Method</th>
                  <th scope="col" className="px-4 py-3">Path</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Key</th>
                  <th scope="col" className="px-4 py-3">Latency</th>
                  <th scope="col" className="px-4 py-3">Timestamp</th>
                  <th scope="col" className="px-4 py-3">Related</th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {paginated.data.map((log) => {
                  const cls = statusClass(log.status);
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-block rounded-md px-2 py-0.5 font-mono text-[10px] font-bold",
                            METHOD_STYLES[log.method] ?? "bg-zinc-100 text-zinc-700"
                          )}
                        >
                          {log.method}
                        </span>
                      </td>
                      <td className="max-w-[280px] px-4 py-3">
                        <span className="block truncate font-mono text-zinc-800 dark:text-zinc-200" title={log.path}>
                          {log.path}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
                            STATUS_BADGE_STYLES[cls]
                          )}
                          title={statusText(log.status)}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block font-medium text-zinc-800 dark:text-zinc-200">
                          {log.keyName}
                        </span>
                        <span className="block font-mono text-[10px] text-zinc-400">{log.keyPrefix}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                        {log.latencyMs} ms
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {f.time(log.timestamp, true)}
                      </td>
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {log.relatedPaymentId && (
                            <Link
                              href={`/payments/${log.relatedPaymentId}`}
                              className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-sky-700 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300"
                              title={`View ${log.relatedPaymentId}`}
                            >
                              <CreditCard className="h-3 w-3" />
                              payment
                            </Link>
                          )}
                          {log.relatedRefundId && (
                            <Link
                              href={`/refunds?refund=${log.relatedRefundId}`}
                              className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-violet-700 hover:bg-violet-100 dark:bg-violet-950/60 dark:text-violet-300"
                              title={`View ${log.relatedRefundId}`}
                            >
                              <RotateCcw className="h-3 w-3" />
                              refund
                            </Link>
                          )}
                          {!log.relatedPaymentId && !log.relatedRefundId && (
                            <span className="text-[10px] text-zinc-300 dark:text-zinc-600">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredLogs.length > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800">
            <span>
              Page {paginated.meta.page} of {paginated.meta.totalPages} · {paginated.meta.total}{" "}
              request{paginated.meta.total !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!paginated.meta.hasPrevPage}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-md border border-zinc-200 px-3 py-1 font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!paginated.meta.hasNextPage}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-md border border-zinc-200 px-3 py-1 font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      <RequestLogDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
