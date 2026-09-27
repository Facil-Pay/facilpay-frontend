"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import Link from "next/link";

import { getPaymentsSync } from "@/app/lib/api/payments";
import { PaymentStatusBadge } from "@/app/components/payments/PaymentStatusBadge";
import { Select } from "@/app/components/ui/Select";
import { DateRangeInput } from "@/app/components/ui/DateRangeInput";
import type {
  Payment,
  PaymentStatus,
  PaymentNetwork,
  PaymentSortField,
  PaymentSortOrder,
} from "@/app/lib/types/payment";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterState {
  search: string;
  status: PaymentStatus | "";
  network: PaymentNetwork | "";
  dateFrom: string;
  dateTo: string;
}

const INITIAL_FILTERS: FilterState = {
  search: "",
  status: "",
  network: "",
  dateFrom: "",
  dateTo: "",
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

function SortIcon({ active, order }: { field: string; active: boolean; order: PaymentSortOrder }) {
  if (!active) {
    return (
      <svg className="h-3.5 w-3.5 text-zinc-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
      </svg>
    );
  }
  return order === "asc" ? (
    <svg className="h-3.5 w-3.5 text-[#55C2FF]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 17a.75.75 0 01-.55-.24l-3.25-3.5a.75.75 0 111.1-1.02L10 15.148l2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5A.75.75 0 0110 17z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className="h-3.5 w-3.5 text-[#55C2FF]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3z" clipRule="evenodd" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 010 1.06L8.06 10l3.72 3.72a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z" clipRule="evenodd" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Status tab strip ─────────────────────────────────────────────────────────

const STATUS_TABS: { value: PaymentStatus | ""; label: string }[] = [
  { value: "",           label: "All"        },
  { value: "pending",    label: "Pending"    },
  { value: "processing", label: "Processing" },
  { value: "completed",  label: "Completed"  },
  { value: "failed",     label: "Failed"     },
  { value: "refunded",   label: "Refunded"   },
  { value: "cancelled",  label: "Cancelled"  },
];

const STATUS_ACTIVE   = "bg-[#000F24] text-white";
const STATUS_INACTIVE = "bg-transparent text-zinc-600 hover:bg-zinc-100";

// ─── Network select options ───────────────────────────────────────────────────

const NETWORK_OPTIONS: { value: PaymentNetwork | ""; label: string }[] = [
  { value: "",         label: "All networks" },
  { value: "stellar",  label: "Stellar"      },
  { value: "ethereum", label: "Ethereum"     },
  { value: "solana",   label: "Solana"       },
  { value: "bitcoin",  label: "Bitcoin"      },
];

// ─── Sort column header ───────────────────────────────────────────────────────

interface SortHeaderProps {
  field: PaymentSortField;
  label: string;
  currentField: PaymentSortField;
  currentOrder: PaymentSortOrder;
  onSort: (field: PaymentSortField) => void;
  className?: string;
}

function SortHeader({ field, label, currentField, currentOrder, onSort, className = "" }: SortHeaderProps) {
  const isActive = currentField === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
        isActive ? "text-[#0077B6]" : "text-zinc-500 hover:text-zinc-800"
      } ${className}`}
      aria-label={`Sort by ${label}${isActive ? (currentOrder === "asc" ? ", ascending" : ", descending") : ""}`}
    >
      {label}
      <SortIcon field={field} active={isActive} order={currentOrder} />
    </button>
  );
}

// ─── Active filter pills ──────────────────────────────────────────────────────

interface FilterPillProps {
  label: string;
  onRemove: () => void;
}

function FilterPill({ label, onRemove }: FilterPillProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#55C2FF]/10 border border-[#55C2FF]/30 text-[#0077B6] text-xs font-medium px-2.5 py-0.5">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="text-[#55C2FF] hover:text-[#0077B6] transition-colors cursor-pointer"
      >
        <XIcon />
      </button>
    </span>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function PaymentRow({ payment }: { payment: Payment }) {
  const date = new Date(payment.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const fmtAmount = payment.amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: payment.currency === "BTC" ? 6 : 2,
  });

  return (
    <Link
      href={`/payments/${payment.id}`}
      className="group flex items-center gap-3 px-5 py-3.5 hover:bg-[#F5F7FA] transition-colors border-b border-zinc-100 last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#55C2FF]"
    >
      {/* Reference + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-zinc-900 group-hover:text-[#0077B6] transition-colors">
            {payment.reference}
          </span>
          <PaymentStatusBadge status={payment.status} size="sm" dot />
        </div>
        {payment.description && (
          <p className="text-xs text-zinc-500 truncate mt-0.5 max-w-xs">{payment.description}</p>
        )}
      </div>

      {/* Sender → Recipient */}
      <div className="hidden md:flex items-center gap-1.5 w-52 min-w-0 shrink-0">
        <span className="text-xs text-zinc-700 font-medium truncate max-w-[86px]">
          {payment.sender.name}
        </span>
        <svg className="h-3 w-3 text-zinc-300 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
        </svg>
        <span className="text-xs text-zinc-700 font-medium truncate max-w-[86px]">
          {payment.recipient.name}
        </span>
      </div>

      {/* Network */}
      <div className="hidden lg:block w-20 shrink-0">
        <span className="text-xs text-zinc-500 capitalize">{payment.network ?? "—"}</span>
      </div>

      {/* Date */}
      <div className="hidden sm:block w-28 shrink-0 text-right">
        <span className="text-xs text-zinc-500 tabular-nums">{date}</span>
      </div>

      {/* Amount */}
      <div className="w-28 shrink-0 text-right">
        <span className="text-sm font-bold text-zinc-900 tabular-nums">{fmtAmount}</span>
        <span className="text-xs text-zinc-400 ml-1">{payment.currency}</span>
      </div>

      {/* Arrow */}
      <div className="text-zinc-300 group-hover:text-[#55C2FF] transition-colors shrink-0" aria-hidden="true">
        <ArrowRightIcon />
      </div>
    </Link>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
      <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
        <svg className="h-7 w-7 text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 001 5.5V6h18v-.5A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v6A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5v-6zM6 13.25a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zm3.25-.75a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-700">No payments found</p>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs">
          {hasFilters
            ? "No payments match your current filters. Try adjusting or clearing them."
            : "No payments have been recorded yet."}
        </p>
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 h-9 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}

function Pagination({ page, totalPages, total, pageSize, hasPrev, hasNext, onPage, onPageSize }: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);

  // Page window: always show first, last, current ±1, with ellipses
  function pageNumbers(): (number | "…")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (page > 3) pages.push("…");
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.push(p);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-zinc-100">
      {/* Result summary + page-size selector */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">
          {total === 0 ? "No results" : `${start}–${end} of ${total}`}
        </p>
        <div className="flex items-center gap-1.5">
          <label htmlFor="page-size" className="text-xs text-zinc-400 whitespace-nowrap">
            Rows
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="h-7 rounded-lg border border-zinc-200 bg-white pl-2 pr-6 text-xs text-zinc-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#55C2FF]"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Page buttons */}
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={!hasPrev}
          aria-label="Previous page"
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeftIcon />
        </button>

        {pageNumbers().map((p, idx) =>
          p === "…" ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-xs text-zinc-400 select-none">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                p === page
                  ? "border-[#55C2FF] bg-[#55C2FF]/10 text-[#0077B6]"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={!hasNext}
          aria-label="Next page"
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRightIcon />
        </button>
      </nav>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface PaymentsListClientProps {
  /** Total payments count (unfiltered, from server) for the stat bar */
  totalCount: number;
  completedCount: number;
  inProgressCount: number;
  failedCount: number;
  totalVolumeUsd: number;
}

export function PaymentsListClient({
  totalCount,
  completedCount,
  inProgressCount,
  failedCount,
  totalVolumeUsd,
}: PaymentsListClientProps) {
  // ── Filter state ────────────────────────────────────────────────────────────
  const [filters, setFilters]     = useState<FilterState>(INITIAL_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── Sort state ──────────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<PaymentSortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<PaymentSortOrder>("desc");

  // ── Pagination state ────────────────────────────────────────────────────────
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // useTransition lets heavy re-renders stay non-blocking
  const [, startTransition] = useTransition();

  // ── Derived: run filter + sort + paginate synchronously ────────────────────
  const result = useMemo(
    () =>
      getPaymentsSync(
        {
          search:   filters.search   || undefined,
          status:   filters.status   || undefined,
          network:  filters.network  || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo:   filters.dateTo   || undefined,
        },
        page,
        pageSize,
        sortField,
        sortOrder
      ),
    [filters, page, pageSize, sortField, sortOrder]
  );

  const totalPages   = Math.max(1, Math.ceil(result.total / pageSize));
  const hasFilters   = !!(
    filters.search || filters.status || filters.network ||
    filters.dateFrom || filters.dateTo
  );

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function patch(delta: Partial<FilterState>) {
    startTransition(() => {
      setFilters((prev) => ({ ...prev, ...delta }));
      setPage(1); // reset to first page on filter change
    });
  }

  function handleSort(field: PaymentSortField) {
    startTransition(() => {
      if (field === sortField) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortOrder("desc");
      }
      setPage(1);
    });
  }

  function handlePageSize(s: number) {
    setPageSize(s);
    setPage(1);
  }

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  }, []);

  // ── Active filter pills ─────────────────────────────────────────────────────
  const pills: { key: keyof FilterState; label: string }[] = [];
  if (filters.status)   pills.push({ key: "status",   label: `Status: ${filters.status}` });
  if (filters.network)  pills.push({ key: "network",  label: `Network: ${filters.network}` });
  if (filters.dateFrom) pills.push({ key: "dateFrom", label: `From: ${filters.dateFrom}` });
  if (filters.dateTo)   pills.push({ key: "dateTo",   label: `To: ${filters.dateTo}` });

  // ── Formatted helpers ───────────────────────────────────────────────────────
  const fmt2 = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Volume",  value: `$${fmt2(totalVolumeUsd)}`, sub: "USD equivalent",      accent: "bg-[#55C2FF]/10", icon: "💳" },
          { label: "Completed",     value: String(completedCount),     sub: "Settled on-chain",     accent: "bg-emerald-100", icon: "✅" },
          { label: "In Progress",   value: String(inProgressCount),    sub: "Pending or processing",accent: "bg-amber-100",   icon: "⏳" },
          { label: "Failed",        value: String(failedCount),        sub: "Requires attention",   accent: "bg-red-100",     icon: "❌" },
        ].map(({ label, value, sub, accent, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${accent} mb-3 text-base select-none`}>
              {icon}
            </div>
            <p className="text-2xl font-bold text-zinc-900 tabular-nums">{value}</p>
            <p className="text-sm text-zinc-500 mt-0.5">{label}</p>
            <p className="text-xs text-zinc-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">

        {/* ── Status tab strip ── */}
        <div className="px-5 pt-4 border-b border-zinc-100">
          <div
            role="tablist"
            aria-label="Filter by status"
            className="flex items-center gap-0.5 overflow-x-auto pb-3 scrollbar-hide"
          >
            {STATUS_TABS.map(({ value, label }) => {
              const isActive = filters.status === value;
              // Count for each tab
              const tabCount = value === ""
                ? totalCount
                : getPaymentsSync({ status: value || undefined }, 1, 9999).total;

              return (
                <button
                  key={value}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => patch({ status: value })}
                  className={`
                    inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 h-8 text-xs font-medium
                    transition-colors cursor-pointer shrink-0
                    ${isActive ? STATUS_ACTIVE : STATUS_INACTIVE}
                  `}
                >
                  {label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-zinc-100 text-zinc-500"
                  }`}>
                    {tabCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Search + filter toolbar ── */}
        <div className="px-5 py-3 border-b border-zinc-100 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
                <SearchIcon />
              </div>
              <input
                type="search"
                placeholder="Search reference, sender, recipient…"
                aria-label="Search payments"
                value={filters.search}
                onChange={(e) => patch({ search: e.target.value })}
                className="w-full h-9 rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#55C2FF] focus:border-transparent transition"
              />
            </div>

            {/* Network select */}
            <Select
              options={NETWORK_OPTIONS}
              value={filters.network}
              onChange={(v) => patch({ network: v })}
              className="w-40"
              aria-label="Filter by network"
            />

            {/* Advanced toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                showAdvanced || filters.dateFrom || filters.dateTo
                  ? "border-[#55C2FF] bg-[#55C2FF]/10 text-[#0077B6]"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
              aria-expanded={showAdvanced}
            >
              <FilterIcon />
              Date range
            </button>

            {/* Clear all */}
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-colors cursor-pointer"
              >
                <XIcon />
                Clear
              </button>
            )}
          </div>

          {/* Advanced: date range */}
          {showAdvanced && (
            <div className="flex flex-wrap gap-3 items-end pt-1 pb-0.5">
              <DateRangeInput
                label="Date range"
                fromValue={filters.dateFrom}
                toValue={filters.dateTo}
                onFromChange={(v) => patch({ dateFrom: v })}
                onToChange={(v) => patch({ dateTo: v })}
                className="flex-1 min-w-[240px] max-w-sm"
              />
            </div>
          )}

          {/* Active filter pills */}
          {pills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-xs text-zinc-400 mr-1">Active:</span>
              {pills.map(({ key, label }) => (
                <FilterPill
                  key={key}
                  label={label}
                  onRemove={() => patch({ [key]: "" } as Partial<FilterState>)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Column headers ── */}
        <div className="flex items-center gap-3 px-5 py-2.5 bg-zinc-50 border-b border-zinc-100">
          <div className="flex-1">
            <SortHeader field="reference" label="Reference" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
          </div>
          <div className="hidden md:block w-52 shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Parties
          </div>
          <div className="hidden lg:block w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Network
          </div>
          <div className="hidden sm:block w-28 shrink-0 text-right">
            <SortHeader field="createdAt" label="Date" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
          </div>
          <div className="w-28 shrink-0 text-right">
            <SortHeader field="amount" label="Amount" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
          </div>
          <div className="w-4 shrink-0" aria-hidden="true" />
        </div>

        {/* ── Rows ── */}
        {result.data.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onReset={resetFilters} />
        ) : (
          <ul role="list" aria-label="Payment transactions">
            {result.data.map((payment) => (
              <li key={payment.id}>
                <PaymentRow payment={payment} />
              </li>
            ))}
          </ul>
        )}

        {/* ── Pagination ── */}
        <Pagination
          page={page}
          totalPages={totalPages}
          total={result.total}
          pageSize={pageSize}
          hasPrev={result.hasPrevPage}
          hasNext={result.hasNextPage}
          onPage={setPage}
          onPageSize={handlePageSize}
        />
      </div>
    </div>
  );
}
